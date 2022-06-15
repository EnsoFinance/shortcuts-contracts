import {expect} from './chai-setup';
import {ethers} from 'hardhat';
import {Contract, ContractTransaction, BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {setup} from './utils';

async function expectEventFromPortal(
  tx: ContractTransaction,
  ownerAddress: string,
  emitterContract: Contract,
  eventName: string,
  ...eventArgs: string[]
) {
  await expect(tx)
    .to.emit(emitterContract.attach(ownerAddress), eventName)
    .withArgs(...eventArgs);
}

describe('Portal', function () {
  describe('PortalFactory', async () => {
    it('should predict address before deploy', async () => {
      const {userWithoutPortal: user} = await setup();
      const predict = await user.PortalFactory.getAddress();

      const tx = await user.PortalFactory.deploy([], []);
      await expect(tx).to.emit(user.PortalFactory, 'Deployed').withArgs(predict);
    });

    it('should execute on already deployed portal', async () => {
      const {userWithPortal, Events} = await setup();

      const planner = new Planner();

      const message = 'Hello World!';

      const weirolledEvents = weiroll.createLibrary(Events);
      planner.add(weirolledEvents.logString(message));
      const {commands, state} = planner.plan();

      const tx = await userWithPortal.Portal.execute(commands, state);

      await expectEventFromPortal(tx, userWithPortal.Portal.address, Events, 'LogString', message);
    });

    it('should allow to execute while deploying portal', async () => {
      const {userWithoutPortal: user, Events} = await setup();

      const portalAddress = await user.PortalFactory.getAddress();

      const message = "I'm deploying a portal!";
      const number = BigNumber.from(42);

      const weirolledEvents = weiroll.createLibrary(Events);
      const planner = new Planner();

      planner.add(weirolledEvents.logString(message));
      planner.add(weirolledEvents.logUint(number));

      const {commands, state} = planner.plan();

      const tx = await user.PortalFactory.deploy(commands, state);

      await expect(tx).to.emit(user.PortalFactory, 'Deployed').withArgs(portalAddress);

      await expectEventFromPortal(tx, portalAddress, Events, 'LogString', message);
      await expectEventFromPortal(tx, portalAddress, Events, 'LogUint', number.toString());
    });

    it('should not allow user to deploy multiple portals', async () => {
      const {userWithPortal} = await setup();

      await expect(userWithPortal.PortalFactory.deploy([], [])).to.be.revertedWith('AlreadyExists()');
    });

    it('should not allow user to deploy multiple portals', async () => {
      const {userWithPortal} = await setup();

      await expect(userWithPortal.PortalFactory.deploy([], [])).to.be.revertedWith('AlreadyExists()');
    });

    it('should not allow user to execute on other user portal', async () => {
      const {userWithPortal, userWithoutPortal: impostor, Portal} = await setup();

      impostor.Portal = Portal.attach(userWithPortal.Portal.address).connect(await ethers.getSigner(impostor.address));
      await expect(impostor.Portal.execute([], [])).to.be.revertedWith('NotCaller()');
    });
  });
});
