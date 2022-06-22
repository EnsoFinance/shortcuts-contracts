import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount} from '../test/utils';
const setupWrapEthAction = async () => {
  const baseSetup = await setup();

  return {
    ...baseSetup,
  };
};

describe('Wrap ETH Action', function () {
  it('should wrap ETH without Portal', async () => {
    const {userWithPortal} = await setupWrapEthAction();

    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const sdk = getMainnetSdk(userWithPortalSigner);
    const weth = sdk.WETH;

    const tx = await weth.deposit({gasLimit: 100000, value: BigNumber.from(1)});
    await tx.wait();

    const balance = await weth.balanceOf(userWithPortal.address);
    expect(balance).to.equal(BigNumber.from(1));
  });

  it.skip('should wrap ETH with Portal', async () => {
    const {userWithPortal} = await setupWrapEthAction();
    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const ethToWrap = BigNumber.from(10).pow(18);

    const sdk = getMainnetSdk(userWithPortalSigner);
    const weth = sdk.WETH;

    const planner = new Planner();

    const weirolledWETH = weiroll.createContract(weth);
    planner.add(weirolledWETH.deposit().withValue(ethToWrap));
    const {commands, state} = planner.plan();

    const weirollTx = await userWithPortal.Portal.execute(commands, state, {gasLimit: 100000, value: ethToWrap});
    await weirollTx.wait();

    const balance = await weth.balanceOf(userWithPortal.Portal.address);
    expect(balance).to.equal(ethToWrap);
  });

  it.skip('should wrap ETH with Portal and transfer it to user', async () => {
    const {userWithPortal} = await setupWrapEthAction();
    const userWithPortalSigner = await impersonateAccount(userWithPortal.address);

    const sdk = getMainnetSdk(userWithPortalSigner);
    const weth = sdk.WETH;
    const planner = new Planner();

    const ethToWrap = BigNumber.from(10).pow(18);

    const weirolledWETH = weiroll.createContract(weth);

    planner.add(weirolledWETH.deposit().withValue(ethToWrap));
    planner.add(weirolledWETH.transfer(userWithPortal.address, ethToWrap));

    const {commands, state} = planner.plan();

    const weirollTx = await userWithPortal.Portal.execute(commands, state, {gasLimit: 100000, value: ethToWrap});
    await weirollTx.wait();

    const balance = await weth.balanceOf(userWithPortal.Portal.address);
    expect(balance).to.equal(ethToWrap);
  });
});
