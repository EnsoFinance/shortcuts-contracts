import {expect} from '../../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {getMainnetSdk} from '../../eth-sdk/sdk';
import {abi as ETokenABI} from './interfaces/EToken.json';
//import {abi as DTokenABI} from './interfaces/DToken.json';

import {setup, impersonateAccount} from '../../test/utils';

const USDC_WHALE = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';

const EULER_PROXY = '0x27182842E098f60e3D576794A5bFFb0777E025d3';

const SDK = getMainnetSdk(ethers.getDefaultProvider());
const EULER_MARKETS = SDK.euler.markets.implementation.attach(SDK.euler.markets.proxy.address);
const EULER_EXEC = SDK.euler.exec.implementation.attach(SDK.euler.exec.proxy.address);
const EULER_SWAP = SDK.euler.swap.implementation.attach(SDK.euler.swap.proxy.address);

const EToken = (address: string) => new ethers.Contract(address, ETokenABI);
//const DToken = (address: string) => new ethers.Contract(address, DTokenABI);

const USD_AMOUNT = 1000;

const setupStEthAction = async () => {
  const baseSetup = await setup();
  const userWithPortal = baseSetup.userWithPortal;

  const SINGLE_USDC = BigNumber.from(10).pow(await SDK.usdc.decimals());
  const usdc = SDK.usdc.connect(await impersonateAccount(USDC_WHALE));
  const sendUSDC = await usdc.transfer(userWithPortal.address, SINGLE_USDC.mul(USD_AMOUNT), {
    gasLimit: 100000,
  });
  await sendUSDC.wait();

  return {
    ...baseSetup,
  };
};

describe('Short stETH Action', function () {
  it('should ...', async () => {
    const SINGLE_USDC = BigNumber.from(10).pow(await SDK.usdc.decimals());
    const SINGLE_WSTETH = BigNumber.from(10).pow(await SDK.wstETH.decimals());

    const {userWithPortal, users} = await setupStEthAction();
    const randomUser = users[0];
    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const USDC = SDK.usdc.connect(userWithPortalSigner);
    const eUSDC = EToken(await EULER_MARKETS.underlyingToEToken(SDK.usdc.address)).connect(userWithPortalSigner);
    const eDai = EToken(await EULER_MARKETS.underlyingToEToken(SDK.dai.address)).connect(userWithPortalSigner);

    await USDC.approve(EULER_PROXY, SINGLE_USDC.mul(USD_AMOUNT));
    await eUSDC.deposit(0, SINGLE_USDC.mul(USD_AMOUNT));
    console.log(await eUSDC.balanceOf(userWithPortal.address));

    //console.log(await EULER_MARKETS.underlyingToAssetConfig(SDK.usdc.address)); //cf = 3600000000 = 0.36
    //console.log(await EULER_MARKETS.underlyingToAssetConfig(SDK.wstETH.address)); //bf = 3560000000 = 0.356
    // const [priceUSDC] = await EULER_EXEC.callStatic.getPrice(SDK.usdc.address); // 15 decimals
    // const [priceWSTETH] = await EULER_EXEC.callStatic.getPrice(SDK.wstETH.address); // 15 decimals
    // console.log('L', ethers.utils.formatUnits(priceUSDC, 15));
    // console.log('L', ethers.utils.formatUnits(priceWSTETH, 15));
    // const wstETHperUSDC = BigNumber.from(10).pow(18).mul(priceUSDC).div(priceWSTETH);
    // const borrowAmount = wstETHperUSDC.mul(USD_AMOUNT).mul(19);
    // console.log('L', ethers.utils.formatUnits(borrowAmount, 18));

    const txToEvents = async (tx: any) => JSON.stringify((await tx.wait()).events, undefined, 2);

    let tx = await eDai.mint(0, 10000);
    console.log(await txToEvents(tx));
    console.log(await eDai.balanceOf(userWithPortal.address));

    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    // tx = await EULER_MARKETS.connect(userWithPortalSigner).enterMarket(0, WETH, {gasLimit: 100000});
    // console.log(await txToEvents(tx));

    // const encodePath = (path: string[], fees: number[]) => {
    //   if (path.length != fees.length + 1) {
    //     throw new Error('path/fee lengths do not match');
    //   }

    //   let encoded = '0x';
    //   for (let i = 0; i < fees.length; i++) {
    //     // 20 byte encoding of the address
    //     encoded += path[i].slice(2);
    //     // 3 byte encoding of the fee
    //     encoded += fees[i].toString(16).padStart(2 * 3, '0');
    //   }
    //   // encode the final token
    //   encoded += path[path.length - 1].slice(2);

    //   return encoded.toLowerCase();
    // };

    // const path = encodePath([SDK.wstETH.address, WETH], [500]);
    const eWETH = EToken(await EULER_MARKETS.underlyingToEToken(WETH)).connect(userWithPortalSigner);
    console.log(await eWETH.balanceOf(userWithPortal.address));

    tx = await EULER_SWAP.connect(userWithPortalSigner).swapUniExactInputSingle({
      subAccountIdIn: 0,
      subAccountIdOut: 0,
      underlyingIn: SDK.usdc.address,
      underlyingOut: WETH,
      amountIn: 1000,
      amountOutMinimum: 0,
      deadline: ethers.constants.MaxUint256,
      fee: 500,
      sqrtPriceLimitX96: 0,
    });
    console.log('WHAT', await txToEvents(tx));

    //console.log(await SDK.wstETH.balanceOf(userWithPortal.address));
    // await ewstETH.withdraw(0, 1000);
    console.log(await eWETH.balanceOf(userWithPortal.address));
  });

  // it('should work with Portal', async () => {
  //   const {userWithPortal, users} = await setupStEthAction();

  //   const randomUser = users[0];

  //   const userWithPortalSigner = await impersonateAccount(userWithPortal.address);
  //   const planner = new Planner();

  //   const sdk = getMainnetSdk(userWithPortalSigner);
  //   const dai = sdk.dai;

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
