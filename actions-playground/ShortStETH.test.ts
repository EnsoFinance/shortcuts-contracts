import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';

const STETH_WHALE = '0x9bdb521a97e95177bf252c253e256a60c3e14447';
const DAI_WHALE = '0x5d38b4e4783e34e2301a2a36c39a03c45798c4dd';

const setupStEthAction = async () => {
  const baseSetup = await setup();

  const userWithPortal = baseSetup.userWithPortal;

  const {deployer} = await getNamedAccounts();
  const deployerSigner = await impersonateAccount(deployer);

  const topUpWhaleTx = await deployerSigner.sendTransaction({
    to: STETH_WHALE,
    value: ethers.utils.parseEther('1'),
    gasLimit: 100000,
  });

  await topUpWhaleTx.wait();
  const stethWhaleSigner = await impersonateAccount(STETH_WHALE);

  const sdk = getMainnetSdk(stethWhaleSigner);
  const stETH = sdk.stETH;

  const sendStEthTx = await stETH.transfer(userWithPortal.address, BigNumber.from(10).pow(18), {
    gasLimit: 100000,
  });
  await sendStEthTx.wait();

  const dai = sdk.dai.connect(await impersonateAccount(DAI_WHALE));
  const tx = await dai.transfer(userWithPortal.address, BigNumber.from(10).pow(18), {gasLimit: 100000});
  await tx.wait();

  return {
    ...baseSetup,
  };
};

describe('Short stETH Action', function () {
  it.skip('should ...', async () => {
    const {userWithPortal, users} = await setupStEthAction();

    const randomUser = users[0];

    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const sdk = getMainnetSdk(userWithPortalSigner);
    const dai = sdk.dai;

    const tx = await dai.transfer(randomUser.address, BigNumber.from(1), {gasLimit: 100000});
    await tx.wait();

    const balance = await dai.balanceOf(randomUser.address);
    expect(balance).to.equal(BigNumber.from(1));
  });

  it('should work with Portal', async () => {
    const {userWithPortal, users} = await setupStEthAction();

    const randomUser = users[0];

    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);
    const planner = new Planner();

    const sdk = getMainnetSdk(userWithPortalSigner);
    const dai = sdk.dai;

    expect(await dai.balanceOf(userWithPortal.address)).to.gte(BigNumber.from(1));

    const weirolledDai = weiroll.createLibrary(dai);

    planner.add(weirolledDai.transfer(randomUser.address, BigNumber.from(1)));

    const {commands, state} = planner.plan();

    const tx = await userWithPortal.Portal.execute(commands, state);
    await tx.wait();

    expect(await dai.balanceOf(randomUser.address)).to.equal(BigNumber.from(1));
  });
});
