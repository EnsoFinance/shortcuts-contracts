import {expect} from '../test/chai-setup';
import {getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';

const DAI_WHALE = '0x5d38b4e4783e34e2301a2a36c39a03c45798c4dd';

const setupTransferDaiAction = async () => {
  const baseSetup = await setup();

  const userWithPortal = baseSetup.userWithPortal;

  const {deployer} = await getNamedAccounts();
  const deployerSigner = await impersonateAccount(deployer);

  const sdk = getMainnetSdk(deployerSigner);

  const dai = sdk.dai.connect(await impersonateAccount(DAI_WHALE));
  const tx = await dai.transfer(userWithPortal.address, BigNumber.from(10).pow(18), {gasLimit: 100000});
  await tx.wait();

  return {
    ...baseSetup,
  };
};

describe('Transfer Dai Action', function () {
  it('should transfer DAI without Portal', async () => {
    const {userWithPortal, users} = await setupTransferDaiAction();

    const randomUser = users[0];

    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const sdk = getMainnetSdk(userWithPortalSigner);
    const dai = sdk.dai;

    const tx = await dai.transfer(randomUser.address, BigNumber.from(1), {gasLimit: 100000});
    await tx.wait();

    const balance = await dai.balanceOf(randomUser.address);
    expect(balance).to.equal(BigNumber.from(1));
  });

  it('should transfer DAI with Portal', async () => {
    const {userWithPortal, users} = await setupTransferDaiAction();
    const randomUser = users[0];

    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);
    const planner = new Planner();

    const sdk = getMainnetSdk(userWithPortalSigner);
    const dai = sdk.dai;

    const approveDaiForPortalTx = await dai.approve(userWithPortal.Portal.address, BigNumber.from(1));
    await approveDaiForPortalTx.wait();
    expect(await dai.allowance(userWithPortal.address, userWithPortal.Portal.address)).to.equal(BigNumber.from(1));

    const weirolledDai = weiroll.createContract(dai);
    planner.add(weirolledDai.transferFrom(userWithPortal.address, randomUser.address, BigNumber.from(1)));
    const {commands, state} = planner.plan();

    const weirollTx = await userWithPortal.Portal.execute(commands, state);
    await weirollTx.wait();

    const balance = await dai.balanceOf(randomUser.address);
    expect(balance).to.equal(BigNumber.from(1));
  });
});
