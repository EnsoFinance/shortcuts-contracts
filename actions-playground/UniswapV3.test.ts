import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';

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

const getTimestamp = async (Utils: any, blockTimestamp: any, minutes = 20) => {
  const minutesAsSeconds = await Utils.mul(minutes, 60);
  const timestamp = await Utils.add(blockTimestamp, minutesAsSeconds);
  return timestamp;
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

describe('Swap on uniswap', function () {
  it('unix deadline', async () => {
    const provider = await ethers.getDefaultProvider();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    // or instead of block.timestamp:
    // const currentTimestamp = Math.round(Date.now() / 1000);

    const minutes = 20;

    const timestamp = block.timestamp + minutes * 60;
    console.log('Timestamp', timestamp);

    expect(timestamp).to.be.gt(0);
  });

  it('unix deadline (weiroll)', async function () {
    const {Utils} = await setup();

    const provider = await ethers.getDefaultProvider();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    const minutes = 20;

    const timestamp = await getTimestamp(Utils, block.timestamp, minutes);
    console.log('Timestamp', timestamp.toNumber());

    expect(timestamp).to.be.gt(0);
  });

  it('quote amount', async () => {
    const sdk = getMainnetSdk(ethers.getDefaultProvider());
    const FEES = [10000, 3000, 500, 100];

    const tokenIn = sdk.WETH.address;
    const tokenOut = sdk.dai.address;

    const res = await Promise.all(
      FEES.map(async (fee) => {
        const amountOut = await sdk.uniswap.Quoter.callStatic.quoteExactInputSingle(
          tokenIn,
          tokenOut,
          fee,
          BigNumber.from(10).pow(18),
          0
        );

        return {
          fee,
          amountOut,
        };
      })
    );

    res.sort((a, b) => {
      if (a.amountOut.gt(b.amountOut)) return -1;
      if (a.amountOut.lt(b.amountOut)) return 1;
      return 0;
    });

    const best = res[0];
    console.log('Fee', best.fee);
    console.log('Amount out', best.amountOut);

    expect(best.fee).to.be.gt(0);
    expect(best.amountOut).to.be.gt(0);
  });

  it('quote amount (weiroll)', async () => {
    const {Utils} = await setup();
    const sdk = getMainnetSdk(ethers.getDefaultProvider());

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

  it('swap amount', async () => {
    const {userWithPortal, Utils} = await setupUniswapV3Action();
    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const sdk = getMainnetSdk(ethers.getDefaultProvider());
    const provider = await ethers.getDefaultProvider();
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

    const sdk = getMainnetSdk(ethers.getDefaultProvider());
    const provider = await ethers.getDefaultProvider();
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
