import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber, providers} from 'ethers';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';
import {Result} from 'ethers/lib/utils';

const DAI_WHALE = '0xad0135af20fa82e106607257143d0060a7eb5cbf';

const setupUniswapV3Action = async () => {
  const baseSetup = await setup();

  const {userWithPortal, userWithoutPortal} = baseSetup;

  const {deployer} = await getNamedAccounts();
  const deployerSigner = await impersonateAccount(deployer);

  const sdk = getMainnetSdk(deployerSigner);

  const dai = sdk.dai.connect(await impersonateAccount(DAI_WHALE));

  await dai.transfer(userWithPortal.address, BigNumber.from(10).pow(25));
  await dai.transfer(userWithoutPortal.address, BigNumber.from(10).pow(25));

  return {
    ...baseSetup,
  };
};

const getStateIndexFromCommand = (command: string) => parseInt(command.slice(13, 14));
const decodeResult = (types: string[], result: Result) => {
  if (types.length > 1) types.unshift('uint');
  const decoded = ethers.utils.defaultAbiCoder.decode(types, result);
  const ret: Record<string, any> = {};
  Object.entries(decoded).forEach(([key, value]) => {
    if (isNaN(parseFloat(key))) ret[key] = value;
  });
  return ret;
};

const getTimestamp = async (Utils: any, blockTimestamp: any, minutes = 20) => {
  const minutesAsSeconds = await Utils.mul(minutes, 60);
  const timestamp = await Utils.add(blockTimestamp, minutesAsSeconds);
  return timestamp;
};

const getTimestampWeiroll = async (Portal: any, Utils: any, Events: any, blockTimestamp: any, minutes = 20) => {
  const planner = new Planner();
  const weirolledUtils = weiroll.createContract(Utils);
  const weirolledEvents = weiroll.createContract(Events);

  const minutesAsSeconds = planner.add(weirolledUtils.mul(minutes, 60));
  const timestamp = planner.add(weirolledUtils.add(blockTimestamp, minutesAsSeconds));
  planner.add(weirolledEvents.logUint(timestamp));

  const {commands, state} = planner.plan();

  const stateIndex = getStateIndexFromCommand(commands[commands.length - 1]);
  const data = await Portal.callStatic.execute(commands, state);

  return decodeResult(['uint timestamp'], data[stateIndex]);
};

const getAmountOut = async (Quoter: any, Utils: any, tokenIn: string, tokenOut: string, amountIn: BigNumber) => {
  const amountOut1 = await Quoter.callStatic.quoteExactInputSingle(tokenIn, tokenOut, 10000, amountIn, 0);
  const amountOut2 = await Quoter.callStatic.quoteExactInputSingle(tokenIn, tokenOut, 3000, amountIn, 0);
  const amountOut3 = await Quoter.callStatic.quoteExactInputSingle(tokenIn, tokenOut, 500, amountIn, 0);
  const amountOut4 = await Quoter.callStatic.quoteExactInputSingle(tokenIn, tokenOut, 100, amountIn, 0);

  const max1 = await Utils.maxWithKey(10000, amountOut1, 3000, amountOut2);
  const max2 = await Utils.maxWithKey(500, amountOut3, 100, amountOut4);
  const best = await Utils.maxWithKey(max1.key, max1.value, max2.key, max2.value);

  return {fee: best.key, amountOut: best.value};
};

const getAmountOutWeiroll = async (
  Portal: any,
  Quoter: any,
  Events: any,
  Utils: any,
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber
) => {
  const planner = new Planner();
  const weirolledUtils = weiroll.createContract(Utils);
  const weirolledEvents = weiroll.createContract(Events);
  const weirolledQuoter = weiroll.createContract(Quoter);

  const amountOut1 = planner.add(weirolledQuoter.quoteExactInputSingle(tokenIn, tokenOut, 10000, amountIn, 0));
  const amountOut2 = planner.add(weirolledQuoter.quoteExactInputSingle(tokenIn, tokenOut, 3000, amountIn, 0));
  const amountOut3 = planner.add(weirolledQuoter.quoteExactInputSingle(tokenIn, tokenOut, 500, amountIn, 0));
  const amountOut4 = planner.add(weirolledQuoter.quoteExactInputSingle(tokenIn, tokenOut, 100, amountIn, 0));

  const max1 = planner.add(weirolledUtils.maxWithKey(10000, amountOut1, 3000, amountOut2).rawValue());
  const max2 = planner.add(weirolledUtils.maxWithKey(500, amountOut3, 100, amountOut4).rawValue());

  const maxFee1Bytes = planner.add(weirolledUtils.extractElement(max1, 0));
  const maxAmountOut1Bytes = planner.add(weirolledUtils.extractElement(max1, 1));
  const maxFee2Bytes = planner.add(weirolledUtils.extractElement(max2, 0));
  const maxAmountOut2Bytes = planner.add(weirolledUtils.extractElement(max2, 1));

  const maxFee1 = planner.add(weirolledUtils.bytes32ToUint256(maxFee1Bytes));
  const maxAmountOut1 = planner.add(weirolledUtils.bytes32ToUint256(maxAmountOut1Bytes));

  const maxFee2 = planner.add(weirolledUtils.bytes32ToUint256(maxFee2Bytes));
  const maxAmountOut2 = planner.add(weirolledUtils.bytes32ToUint256(maxAmountOut2Bytes));

  const best = planner.add(weirolledUtils.maxWithKey(maxFee1, maxAmountOut1, maxFee2, maxAmountOut2).rawValue());
  planner.add(weirolledEvents.logBytes(best));

  const {commands, state} = planner.plan();

  const stateIndex = getStateIndexFromCommand(commands[commands.length - 1]);
  const data = await Portal.callStatic.execute(commands, state);

  return decodeResult(['uint fee', 'uint amountOut'], data[stateIndex]);
};

describe('Swap on uniswap', function () {
  it('unix deadline', async () => {
    const {Utils, userWithPortal} = await setup();

    const signer = await impersonateAccount(userWithPortal.address);
    const provider = signer.provider as providers.JsonRpcProvider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    // or instead of block.timestamp:
    // const currentTimestamp = Math.round(Date.now() / 1000);

    const minutes = 20;

    const timestamp = await getTimestamp(Utils, block.timestamp, minutes);
    console.log('Timestamp', timestamp.toNumber());

    expect(timestamp).to.be.gt(0);
  });

  it('unix deadline (portal)', async function () {
    const {Utils, Events, userWithPortal} = await setup();

    const signer = await impersonateAccount(userWithPortal.address);
    const provider = signer.provider as providers.JsonRpcProvider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    const minutes = 20;

    const {timestamp} = await getTimestampWeiroll(userWithPortal.Portal, Utils, Events, block.timestamp, minutes);
    console.log('Timestamp', timestamp.toNumber());

    expect(timestamp).to.be.gt(0);
  });

  it('quote amount', async () => {
    const {Utils, userWithPortal} = await setup();

    const signer = await impersonateAccount(userWithPortal.address);
    const sdk = getMainnetSdk(signer);

    const best = await getAmountOut(
      sdk.uniswap.Quoter,
      Utils,
      sdk.dai.address,
      sdk.WETH.address,
      BigNumber.from(10).pow(18)
    );

    console.log('Fee', best.fee.toNumber());
    console.log('Amount out', best.amountOut);

    expect(best.fee).to.be.gt(0);
    expect(best.amountOut).to.be.gt(0);
  });

  it('quote amount (portal)', async () => {
    const {Utils, Events, userWithPortal} = await setup();
    const signer = await impersonateAccount(userWithPortal.address);
    const sdk = getMainnetSdk(signer);

    const {fee, amountOut} = await getAmountOutWeiroll(
      userWithPortal.Portal,
      sdk.uniswap.Quoter,
      Events,
      Utils,
      sdk.dai.address,
      sdk.WETH.address,
      BigNumber.from(10).pow(18)
    );

    console.log('Fee', fee.toNumber());
    console.log('Amount out', amountOut);

    expect(fee).to.be.gt(0);
    expect(amountOut).to.be.gt(0);
  });

  it('swap amount', async () => {
    const {userWithPortal, Utils} = await setupUniswapV3Action();
    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const sdk = getMainnetSdk(userWithPortalSigner);
    const provider = userWithPortalSigner.provider as providers.JsonRpcProvider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    const tokenIn = sdk.dai.address;
    const tokenOut = sdk.WETH.address;
    const amountIn = BigNumber.from(10).pow(18).mul(50000);
    const deadline = await getTimestamp(Utils, block.timestamp, 20);
    const {fee, amountOut} = await getAmountOut(sdk.uniswap.Quoter, Utils, tokenIn, tokenOut, amountIn);

    let gasUsed = 0;

    const approveTx = await sdk.dai.connect(userWithPortalSigner).approve(sdk.uniswap.V3SwapRouter.address, amountIn);
    const swapTx = await sdk.uniswap.V3SwapRouter.connect(userWithPortalSigner).exactInputSingle({
      tokenIn,
      tokenOut,
      fee,
      recipient: userWithPortal.address,
      deadline,
      amountIn,
      amountOutMinimum: amountOut.mul(995).div(1000),
      sqrtPriceLimitX96: 0,
    });

    gasUsed += (await approveTx.wait()).gasUsed.toNumber();
    gasUsed += (await swapTx.wait()).gasUsed.toNumber();

    console.log('Swap:', gasUsed);
  });

  it('swap amount (portal)', async () => {
    const {userWithPortal, Utils} = await setupUniswapV3Action();
    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const sdk = getMainnetSdk(userWithPortalSigner);
    const provider = userWithPortalSigner.provider as providers.JsonRpcProvider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    const tokenIn = sdk.dai.address;
    const tokenOut = sdk.WETH.address;
    const amountIn = BigNumber.from(10).pow(18).mul(500);
    const deadline = await getTimestamp(Utils, block.timestamp, 20);
    const {fee, amountOut} = await getAmountOut(sdk.uniswap.Quoter, Utils, tokenIn, tokenOut, amountIn);

    await sdk.dai.connect(userWithPortalSigner).transfer(userWithPortal.Portal.address, amountIn);

    const planner = new Planner();
    const weirolledDai = weiroll.createContract(sdk.dai);
    const weirolledUniv3SwapRouter = weiroll.createContract(sdk.uniswap.V3SwapRouter);

    const encodePath = (path: string[], fees: number[]) => {
      if (path.length != fees.length + 1) {
        throw new Error('path/fee lengths do not match');
      }

      let encoded = '0x';
      for (let i = 0; i < fees.length; i++) {
        // 20 byte encoding of the address
        encoded += path[i].slice(2);
        // 3 byte encoding of the fee
        encoded += fees[i].toString(16).padStart(2 * 3, '0');
      }
      // encode the final token
      encoded += path[path.length - 1].slice(2);

      return encoded.toLowerCase();
    };

    planner.add(weirolledDai.approve(sdk.uniswap.V3SwapRouter.address, amountIn));
    planner.add(
      weirolledUniv3SwapRouter.exactInput({
        path: encodePath([tokenIn, tokenOut], [fee.toNumber()]),
        recipient: userWithPortal.address,
        deadline,
        amountIn,
        amountOutMinimum: amountOut.mul(995).div(1000),
        sqrtPriceLimitX96: 0,
      })
    );

    const {commands, state} = planner.plan();
    const weirollTx = await userWithPortal.Portal.execute(commands, state);
    console.log('Swap (portal):', (await weirollTx.wait()).gasUsed.toNumber());
  });
});
