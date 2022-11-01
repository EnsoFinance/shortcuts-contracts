import {expect} from './chai-setup';
import {ethers} from 'hardhat';
import {Contract, ContractTransaction, BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {setup} from './utils';

async function expectEventFromEnsoWallet(
  tx: ContractTransaction,
  emitterContract: Contract,
  eventName: string,
  ...eventArgs: string[]
) {
  await expect(tx)
    .to.emit(emitterContract, eventName)
    .withArgs(...eventArgs);
}

describe('EnsoWallet', async () => {
  it('should execute on already deployed EnsoWallet', async () => {
    const {
      userWithEnsoWallet,
      contracts: {
        testing: {Events},
      },
    } = await setup();

    const planner = new Planner();

    const message = 'Hello World!';

    const weirolledEvents = weiroll.createContract(Events as any);
    planner.add(weirolledEvents.logString(message));
    const {commands, state} = planner.plan();
    const tx = await userWithEnsoWallet.EnsoWallet.executeShortcut(commands, state);

    await expectEventFromEnsoWallet(tx, Events, 'LogString', message);
  });

  it('should not allow user to execute on other user EnsoWallet', async () => {
    const {
      userWithEnsoWallet,
      userWithoutEnsoWallet: impostor,
      contracts: {
        core: {EnsoWallet},
      },
    } = await setup();

    impostor.EnsoWallet = EnsoWallet.attach(userWithEnsoWallet.EnsoWallet.address).connect(
      await ethers.getSigner(impostor.address)
    );
    await expect(impostor.EnsoWallet.executeShortcut([], [])).to.be.revertedWith('NotPermitted');
  });
});
