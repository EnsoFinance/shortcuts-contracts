import {use as chaiUse, expect} from 'chai';
import {ethers, waffle} from 'hardhat';
import {Contract, ContractTransaction, Event} from 'ethers';
import {Signer} from 'ethers';
import {
  EnsoVM,
  EnsoVM__factory,
  Events,
  Events__factory,
  Portal,
  PortalFactory,
  PortalFactory__factory,
  Portal__factory,
} from '../typechain';
import * as weiroll from '@weiroll/weiroll.js';

chaiUse(waffle.solidity);

async function deployLibrary(name: string) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy();
  return weiroll.Contract.createLibrary(contract);
}

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
  const supply = ethers.BigNumber.from('100000000000000000000');

  let EnsoVM: EnsoVM__factory,
    vm: EnsoVM,
    Factory: PortalFactory__factory,
    factory: PortalFactory,
    Portal: Portal__factory,
    portal: Portal,
    events: weiroll.Contract,
    eventsContract: Events,
    erc20: weiroll.Contract,
    addr1: Signer,
    owner: Signer;

  before(async () => {
    [owner, addr1] = await ethers.getSigners();
    erc20 = await deployLibrary('LibERC20');

    const eventsFactory = (await ethers.getContractFactory('Events')) as Events__factory;
    eventsContract = await eventsFactory.deploy();
    events = weiroll.Contract.createLibrary(eventsContract);

    EnsoVM = (await ethers.getContractFactory('EnsoVM')) as EnsoVM__factory;
    vm = await EnsoVM.deploy();

    Portal = (await ethers.getContractFactory('Portal')) as Portal__factory;
    portal = await Portal.deploy();

    Factory = (await ethers.getContractFactory('PortalFactory')) as PortalFactory__factory;
    factory = await Factory.deploy(vm.address, portal.address);
  });

  describe('PortalFactory', async () => {
    it('should predict address before deploy', async () => {
      const predict = await factory.getAddress();

      const tx = await factory.deploy([], []);
      await expect(tx).to.emit(factory, 'Deployed').withArgs(predict);
    });

    it('should execute on already deployed portal', async () => {
      const portal = Portal.attach(await factory.getAddress());

      const planner = new weiroll.Planner();

      const message = 'Hello World!';
      planner.add(events.logString(message));

      const {commands, state} = planner.plan();

      const tx = await portal.execute(commands, state);

      await expectEventFromPortal(tx, portal.address, eventsContract, 'LogString', message);
    });
  });
});
