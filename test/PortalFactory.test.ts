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

describe('EnsoWallet', function () {
  describe('EnsoWalletFactory', async () => {
    let vitalik = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

    it('should predict address before deploy', async () => {
      const {userWithoutEnsoWallet: user} = await setup();
      const predict = await user.EnsoWalletFactory.getAddress();
      const walletAdmin = vitalik
      const tx = await user.EnsoWalletFactory.deploy(walletAdmin, [], []);
      await expect(tx).to.emit(user.EnsoWalletFactory, 'Deployed').withArgs(predict);
    });

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
      const tx = await userWithEnsoWallet.EnsoWallet.execute(commands, state);

      await expectEventFromEnsoWallet(tx, Events, 'LogString', message);
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
      const walletAdmin = vitalik
      const tx = await user.EnsoWalletFactory.deploy(walletAdmin, commands, state);

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
      const walletAdmin = vitalik
      const tx = await user.EnsoWalletFactory.deploy(walletAdmin, commands, state, {
        value: value,
      });

      await expect(tx).to.emit(user.EnsoWalletFactory, 'Deployed').withArgs(EnsoWalletAddress);

      await expectEventFromEnsoWallet(tx, PayableEvents, 'LogUint', value.toString());
      await expectEventFromEnsoWallet(tx, PayableEvents, 'LogUint', number.toString());
    });

    it('should not allow user to deploy multiple EnsoWallets', async () => {
      const {userWithEnsoWallet} = await setup();
      const walletAdmin = vitalik
      await expect(userWithEnsoWallet.EnsoWalletFactory.deploy(walletAdmin, [], [])).to.be.revertedWith('ERC1167: create2 failed');
    });

    it('should not allow user to deploy multiple EnsoWallets', async () => {
      const {userWithEnsoWallet} = await setup();
      const walletAdmin = vitalik
      await expect(userWithEnsoWallet.EnsoWalletFactory.deploy(walletAdmin, [], [])).to.be.revertedWith('ERC1167: create2 failed');
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
      await expect(impostor.EnsoWallet.execute([], [])).to.be.revertedWith('NotCaller()');
    });
  });
});
