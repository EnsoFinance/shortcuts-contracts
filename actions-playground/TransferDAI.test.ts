import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';
const DAI_WHALE = '0xad0135af20fa82e106607257143d0060a7eb5cbf';

const setupTransferDaiAction = async () => {
  const baseSetup = await setup();

  const {userWithEnsoWallet, userWithoutEnsoWallet} = baseSetup;

  const {deployer} = await getNamedAccounts();
  const deployerSigner = await impersonateAccount(deployer);

  const sdk = getMainnetSdk(deployerSigner);

  const dai = sdk.dai.connect(await impersonateAccount(DAI_WHALE));

  const topUpUserWithEnsoWalletTx = await dai.transfer(userWithEnsoWallet.address, BigNumber.from(10).pow(18).mul(10), {
    gasLimit: 100000,
  });
  await topUpUserWithEnsoWalletTx.wait();
  const topUpUserWithoutEnsoWalletTx = await dai.transfer(
    userWithoutEnsoWallet.address,
    BigNumber.from(10).pow(18).mul(10),
    {
      gasLimit: 100000,
    }
  );
  await topUpUserWithoutEnsoWalletTx.wait();

  return {
    ...baseSetup,
  };
};

describe('Transfer Dai Action', function () {
  it('should transfer DAI without EnsoWallet', async () => {
    const {userWithEnsoWallet, users} = await setupTransferDaiAction();

    const randomUser = users[0];

    const userWithEnsoWalletSigner = await impersonateAccount(userWithEnsoWallet.address);

    const sdk = getMainnetSdk(userWithEnsoWalletSigner);
    const dai = sdk.dai;

    const tx = await dai.transfer(randomUser.address, BigNumber.from(1), {gasLimit: 100000});
    await tx.wait();

    const balance = await dai.balanceOf(randomUser.address);
    expect(balance).to.equal(BigNumber.from(1));
  });

  it('should transfer DAI with EnsoWallet', async () => {
    const {userWithEnsoWallet: user, users} = await setupTransferDaiAction();
    const randomUser = users[0];

    const userWithEnsoWalletSigner = await impersonateAccount(user.address);
    const planner = new Planner();

    const sdk = getMainnetSdk(userWithEnsoWalletSigner);
    const dai = sdk.dai;

    const daiToSend = BigNumber.from(10).pow(18);
    const topUpEnsoWalletWithDaiTx = await dai.transfer(user.EnsoWallet.address, daiToSend);
    await topUpEnsoWalletWithDaiTx.wait();

    const weirolledDai = weiroll.createContract(dai);
    planner.add(weirolledDai.transfer(randomUser.address, daiToSend));
    const {commands, state} = planner.plan();

    const weirollTx = await user.EnsoWallet.execute(commands, state);
    await weirollTx.wait();

    const balance = await dai.balanceOf(randomUser.address);
    expect(balance).to.equal(daiToSend);
  });

  it('should transfer DAI with EnsoWallet during deployment through EnsoWalletFactory', async () => {
    const {userWithEnsoWallet: user, users} = await setupTransferDaiAction();
    const randomUser = users[0];

    const userWithEnsoWalletSigner = await impersonateAccount(user.address);
    const planner = new Planner();

    const sdk = getMainnetSdk(userWithEnsoWalletSigner);
    const dai = sdk.dai;

    const daiToSend = BigNumber.from(10).pow(18);
    const topUpEnsoWalletWithDaiTx = await dai.transfer(user.EnsoWallet.address, daiToSend);
    await topUpEnsoWalletWithDaiTx.wait();

    const weirolledDai = weiroll.createContract(dai);
    planner.add(weirolledDai.transfer(randomUser.address, daiToSend));
    const {commands, state} = planner.plan();

    const weirollTx = await user.EnsoWallet.execute(commands, state);
    await weirollTx.wait();

    const balance = await dai.balanceOf(randomUser.address);
    expect(balance).to.equal(daiToSend);
  });
});
