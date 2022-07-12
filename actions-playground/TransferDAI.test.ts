import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';
const DAI_WHALE = '0xad0135af20fa82e106607257143d0060a7eb5cbf';

const setupTransferDaiAction = async () => {
  const baseSetup = await setup();

  const {userWithPortal, userWithoutPortal} = baseSetup;

  const {deployer} = await getNamedAccounts();
  const deployerSigner = await impersonateAccount(deployer);

  const sdk = getMainnetSdk(deployerSigner);

  const dai = sdk.dai.connect(await impersonateAccount(DAI_WHALE));

  const topUpUserWithPortalTx = await dai.transfer(userWithPortal.address, BigNumber.from(10).pow(18).mul(10), {
    gasLimit: 100000,
  });
  await topUpUserWithPortalTx.wait();
  const topUpUserWithoutPortalTx = await dai.transfer(userWithoutPortal.address, BigNumber.from(10).pow(18).mul(10), {
    gasLimit: 100000,
  });
  await topUpUserWithoutPortalTx.wait();

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
    const {userWithPortal: user, users} = await setupTransferDaiAction();
    const randomUser = users[0];

    const userWithPortalSigner = await impersonateAccount(user.address);
    const planner = new Planner();

    const sdk = getMainnetSdk(userWithPortalSigner);
    const dai = sdk.dai;

    const daiToSend = BigNumber.from(10).pow(18);
    const topUpPortalWithDaiTx = await dai.transfer(user.Portal.address, daiToSend);
    await topUpPortalWithDaiTx.wait();

    const weirolledDai = weiroll.createContract(dai);
    planner.add(weirolledDai.transfer(randomUser.address, daiToSend));
    const {commands, state} = planner.plan();

    const weirollTx = await user.Portal.execute(commands, state);
    await weirollTx.wait();

    const balance = await dai.balanceOf(randomUser.address);
    expect(balance).to.equal(daiToSend);
  });
});
