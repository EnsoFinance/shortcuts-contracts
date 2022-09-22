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

describe('EnsoWalletFactory', async () => {
  it('should predict address before deploy', async () => {
    const {userWithoutEnsoWallet: user} = await setup();
    const predict = await user.EnsoWalletFactory.getAddress();

    const tx = await user.EnsoWalletFactory.deploy([], []);
    await expect(tx).to.emit(user.EnsoWalletFactory, 'Deployed').withArgs(predict);
  });

  it('should allow to execute while deploying EnsoWallet', async () => {
    const {
      userWithoutEnsoWallet: user,
      contracts: {
        testing: {Events},
      },
    } = await setup();

    const EnsoWalletAddress = await user.EnsoWalletFactory.getAddress();

    const message = "I'm deploying a EnsoWallet!";
    const number = BigNumber.from(42);

    const weirolledEvents = weiroll.createContract(Events as any);
    const planner = new Planner();
    planner.add(weirolledEvents.logString(message));
    planner.add(weirolledEvents.logUint(number));

    const {commands, state} = planner.plan();

    const tx = await user.EnsoWalletFactory.deploy(commands, state);

    await expect(tx).to.emit(user.EnsoWalletFactory, 'Deployed').withArgs(EnsoWalletAddress);

    await expectEventFromEnsoWallet(tx, Events, 'LogUint', number.toString());
    await expectEventFromEnsoWallet(tx, Events, 'LogString', message);
  });

  it('should allow to execute with value while deploying EnsoWallet when transferring value', async () => {
    const {
      userWithoutEnsoWallet: user,
      contracts: {
        testing: {PayableEvents},
      },
    } = await setup();
    const EnsoWalletAddress = await user.EnsoWalletFactory.getAddress();

    const number = BigNumber.from(42);

    const weirolledEvents = weiroll.createContract(PayableEvents as any);
    const planner = new Planner();
    const value = 1;

    planner.add(weirolledEvents.logValue().withValue(value));
    planner.add(weirolledEvents.logUint(number));

    const {commands, state} = planner.plan();

    const tx = await user.EnsoWalletFactory.deploy(commands, state, {
      value: value,
    });

    await expect(tx).to.emit(user.EnsoWalletFactory, 'Deployed').withArgs(EnsoWalletAddress);

    await expectEventFromEnsoWallet(tx, PayableEvents, 'LogUint', value.toString());
    await expectEventFromEnsoWallet(tx, PayableEvents, 'LogUint', number.toString());
  });

  it('should not allow user to deploy multiple EnsoWallets', async () => {
    const {userWithEnsoWallet} = await setup();

    await expect(userWithEnsoWallet.EnsoWalletFactory.deploy([], [])).to.be.revertedWith('create2 failed');
  });

  it('should not allow user to deploy multiple EnsoWallets', async () => {
    const {userWithEnsoWallet} = await setup();

    await expect(userWithEnsoWallet.EnsoWalletFactory.deploy([], [])).to.be.revertedWith('create2 failed');
  });
});