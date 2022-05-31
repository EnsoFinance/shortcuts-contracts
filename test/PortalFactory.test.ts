import {expect} from './chai-setup';
import {ethers, deployments, getNamedAccounts, getUnnamedAccounts} from 'hardhat';
import {Contract, ContractTransaction, BigNumber} from 'ethers';
import {EnsoVM, Events, Portal, PortalFactory} from '../typechain';
import {Planner, Contract as weiroll} from '@weiroll/weiroll.js';
import {setupUser, setupUsers} from './utils';

const setup = deployments.createFixture(async () => {
  await deployments.fixture('PortalFactory');

  const {deployer} = await getNamedAccounts();

  await deployments.deploy('Events', {
    from: deployer,
    args: [],
    autoMine: true,
  });

  const contracts = {
    PortalFactory: <PortalFactory>await ethers.getContract('PortalFactory'),
    Portal: <Portal>await ethers.getContract('Portal'),
    Events: <Events>await ethers.getContract('Events'),
    EnsoVM: <EnsoVM>await ethers.getContract('EnsoVM'),
  };

  const [user, ...users] = await setupUsers(await getUnnamedAccounts(), contracts);

  const deployerUser = await setupUser(deployer, contracts);
  await deployerUser.PortalFactory.deploy([], []);
  deployerUser.Portal = contracts.Portal.attach(await deployerUser.PortalFactory.getAddress());

  return {
    ...contracts,
    users,
    deployer: deployerUser,
    user: user,
  };
});

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
      const {user} = await setup();
      const predict = await user.PortalFactory.getAddress();

      const tx = await user.PortalFactory.deploy([], []);
      await expect(tx).to.emit(user.PortalFactory, 'Deployed').withArgs(predict);
    });

    it('should execute on already deployed portal', async () => {
      const {Portal, PortalFactory, Events} = await setup();
      const portal = Portal.attach(await PortalFactory.getAddress());

      const planner = new Planner();

      const message = 'Hello World!';

      const weirolledEvents = weiroll.createLibrary(Events);
      planner.add(weirolledEvents.logString(message));

      const {commands, state} = planner.plan();

      const tx = await portal.execute(commands, state);

      await expectEventFromPortal(tx, portal.address, Events, 'LogString', message);
    });
  });
});
