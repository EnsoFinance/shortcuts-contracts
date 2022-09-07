import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';
const setupWrapEthAction = async () => {
  const baseSetup = await setup();

  return {
    ...baseSetup,
  };
};

describe('Wrap ETH Action', function () {
  it('should wrap ETH without EnsoWallet', async () => {
    const {userWithEnsoWallet} = await setupWrapEthAction();

    const userWithEnsoWalletSigner = await impersonateAccount(userWithEnsoWallet.address);

    const sdk = getMainnetSdk(userWithEnsoWalletSigner);
    const weth = sdk.WETH;

    const tx = await weth.deposit({gasLimit: 100000, value: BigNumber.from(1)});
    await tx.wait();

    const balance = await weth.balanceOf(userWithEnsoWallet.address);
    expect(balance).to.equal(BigNumber.from(1));
  });

  it('should wrap ETH with EnsoWallet', async () => {
    const {userWithEnsoWallet} = await setupWrapEthAction();
    const userWithEnsoWalletSigner = await impersonateAccount(userWithEnsoWallet.address);

    const ethToWrap = BigNumber.from(10).pow(18);

    const sdk = getMainnetSdk(userWithEnsoWalletSigner);
    const weth = sdk.WETH;

    const planner = new Planner();

    const weirolledWETH = weiroll.createContract(weth);
    planner.add(weirolledWETH.deposit().withValue(ethToWrap));
    const {commands, state} = planner.plan();

    const weirollTx = await userWithEnsoWallet.EnsoWallet.execute(commands, state, {value: ethToWrap});
    await weirollTx.wait();

    const balance = await weth.balanceOf(userWithEnsoWallet.EnsoWallet.address);
    expect(balance).to.equal(ethToWrap);
  });

  it('should wrap ETH with EnsoWallet during deployment through EnsoWalletFactory', async () => {
    const {userWithoutEnsoWallet} = await setupWrapEthAction();

    const userWithEnsoWalletSigner = await impersonateAccount(userWithoutEnsoWallet.address);

    const ethToWrap = BigNumber.from(10).pow(18);

    const sdk = getMainnetSdk(userWithEnsoWalletSigner);
    const weth = sdk.WETH;

    const planner = new Planner();

    const weirolledWETH = weiroll.createContract(weth);
    planner.add(weirolledWETH.deposit().withValue(ethToWrap));
    const {commands, state} = planner.plan();

    const weirollTx = await userWithoutEnsoWallet.EnsoWalletFactory.deploy(commands, state, {
      value: ethToWrap,
    });
    await weirollTx.wait();

    const balance = await weth.balanceOf(userWithoutEnsoWallet.EnsoWallet.address);
    expect(balance).to.equal(ethToWrap);
  });

  it('should wrap ETH with EnsoWallet and transfer it to user', async () => {
    const {userWithEnsoWallet} = await setupWrapEthAction();
    const userWithEnsoWalletSigner = await impersonateAccount(userWithEnsoWallet.address);

    const sdk = getMainnetSdk(userWithEnsoWalletSigner);
    const weth = sdk.WETH;
    const planner = new Planner();

    const ethToWrap = BigNumber.from(10).pow(18);

    const weirolledWETH = weiroll.createContract(weth);

    planner.add(weirolledWETH.deposit().withValue(ethToWrap));
    planner.add(weirolledWETH.transfer(userWithEnsoWallet.address, ethToWrap));

    const {commands, state} = planner.plan();

    const weirollTx = await userWithEnsoWallet.EnsoWallet.execute(commands, state, {value: ethToWrap});
    await weirollTx.wait();

    const userWethBalance = await weth.balanceOf(userWithEnsoWallet.address);
    expect(userWethBalance).to.equal(ethToWrap);
  });
});
