import {expect} from '../../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {getMainnetSdk} from '../../eth-sdk/sdk';
import {abi as ETokenABI} from './interfaces/EToken.json';

import {setup, impersonateAccount} from '../../test/utils';

const USDC_WHALE = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';

const EULER_PROXY = '0x27182842E098f60e3D576794A5bFFb0777E025d3';

const SDK = getMainnetSdk(ethers.getDefaultProvider());
const EULER_MARKETS = SDK.euler.markets.implementation.attach(SDK.euler.markets.proxy.address);
const EULER_EXEC = SDK.euler.exec.implementation.attach(SDK.euler.exec.proxy.address);
const EULER_SWAP = SDK.euler.swap.implementation.attach(SDK.euler.swap.proxy.address);

const EToken = (address: string) => new ethers.Contract(address, ETokenABI);

const TOKEN_IN_AMOUNT = 1000;

const setupStEthAction = async () => {
  const baseSetup = await setup();
  const userWithPortal = baseSetup.userWithPortal;

  const SINGLE_USDC = BigNumber.from(10).pow(await SDK.usdc.decimals());
  const usdc = SDK.usdc.connect(await impersonateAccount(USDC_WHALE));
  const sendUSDC = await usdc.transfer(userWithPortal.address, SINGLE_USDC.mul(1), {
    gasLimit: 100000,
  });
  await sendUSDC.wait();

  //await SDK.weth.connect(await impersonateAccount(userWithPortal.address)).deposit({value: TOKEN_IN_AMOUNT});

  return {
    ...baseSetup,
  };
};

const txToEvents = async (tx: any) => JSON.stringify((await tx.wait()).events, undefined, 2);

describe('Short stETH Action', function () {
  it('should ...', async () => {
    const SINGLE_USDC = BigNumber.from(10).pow(await SDK.usdc.decimals());

    const {userWithPortal} = await setupStEthAction();
    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const USDC = SDK.usdc.connect(userWithPortalSigner);
    const eUSDC = EToken(await EULER_MARKETS.underlyingToEToken(SDK.usdc.address)).connect(userWithPortalSigner);
    const ewstETH = EToken(await EULER_MARKETS.underlyingToEToken(SDK.wstETH.address)).connect(userWithPortalSigner);

    await USDC.approve(EULER_PROXY, SINGLE_USDC.mul(1));
    await eUSDC.deposit(0, 1);
    await EULER_MARKETS.connect(userWithPortalSigner).enterMarket(0, SDK.usdc.address);

    console.log(await eUSDC.balanceOf(userWithPortal.address));

    const collateralAssetConfig = await EULER_MARKETS.underlyingToAssetConfig(SDK.usdc.address);
    const borrowAssetConfig = await EULER_MARKETS.underlyingToAssetConfig(SDK.wstETH.address);

    const [collateralPrice] = await EULER_EXEC.callStatic.getPrice(SDK.usdc.address);
    const [borrowPrice] = await EULER_EXEC.callStatic.getPrice(SDK.wstETH.address);

    const riskAdjustedValue = BigNumber.from(TOKEN_IN_AMOUNT)
      .mul(collateralPrice)
      .mul(collateralAssetConfig.collateralFactor)
      .div(4e9);
    console.log('OC', ethers.utils.formatEther(riskAdjustedValue));

    const borrowAllowance = riskAdjustedValue.mul(borrowAssetConfig.borrowFactor).div(4e9).mul(20); // aka divide by 0.05
    console.log('X', ethers.utils.formatEther(borrowAllowance));

    const borrowAmount = borrowAllowance.mul(BigNumber.from(10).pow(18)).div(borrowPrice);
    console.log('Mintable amount', ethers.utils.formatEther(borrowAmount));

    let tx = await ewstETH.mint(0, 18); // 24281 fails
    console.log(await txToEvents(tx));
    console.log(await ewstETH.balanceOf(userWithPortal.address));

    tx = await EULER_SWAP.connect(userWithPortalSigner).swapUniExactInputSingle({
      subAccountIdIn: 0,
      subAccountIdOut: 0,
      underlyingIn: SDK.wstETH.address,
      underlyingOut: SDK.weth.address,
      amountIn: 18,
      amountOutMinimum: 0,
      deadline: ethers.constants.MaxUint256,
      fee: 500,
      sqrtPriceLimitX96: 0,
    });
    console.log('WHAT', await txToEvents(tx));

    const eWETH = EToken(await EULER_MARKETS.underlyingToEToken(SDK.weth.address)).connect(userWithPortalSigner);
    console.log(await eWETH.balanceOf(userWithPortal.address));
  });

  // it('should work with Portal', async () => {
  //   const {userWithPortal, users} = await setupStEthAction();

  //   const randomUser = users[0];

  //   const userWithPortalSigner = await impersonateAccount(userWithPortal.address);
  //   const planner = new Planner();

  //   const sdk = getMainnetSdk(userWithPortalSigner);
  //   const dai = SDK.wstETH;

  //   await (await dai.approve(userWithPortal.Portal.address, BigNumber.from(1))).wait();
  //   const weirolledDai = weiroll.createContract(dai);

  //   planner.add(weirolledDai.transferFrom(userWithPortal.address, randomUser.address, BigNumber.from(1)));

  //   const {commands, state} = planner.plan();

  //   const tx = await userWithPortal.Portal.execute(commands, state);
  //   await tx.wait();

  //   const balance = await dai.balanceOf(randomUser.address);
  //   expect(balance).to.equal(BigNumber.from(1));
  // });
});
