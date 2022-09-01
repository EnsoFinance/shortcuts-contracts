import {expect} from './chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BasicV1, FormatterV1, Portal, PortalFactory} from '../typechain';
import {setup} from './utils';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {Contract} from 'ethers';

describe('Utils', async () => {
  describe('BasicV1', () => {
    let BasicV1: BasicV1;

    before(async () => {
      BasicV1 = <BasicV1>await ethers.getContract('BasicV1');
    });

    it('getBalance', async () => {
      const {deployer: testAddress} = await getNamedAccounts();
      expect(await BasicV1.getBalance(testAddress)).to.eq(await ethers.provider.getBalance(testAddress));
    });

    it('getBlocktimestamp', async () => {
      expect(await BasicV1.getBlockTimestamp()).to.eq((await ethers.provider.getBlock('latest')).timestamp);
    });
  });

  describe('FormatterV1', () => {
    let FormatterV1: FormatterV1;

    before(async () => {
      FormatterV1 = <FormatterV1>await ethers.getContract('FormatterV1');
    });

    it('bytesToString', async () => {
      const testString = 'Hello World!';
      expect(await FormatterV1.bytesToString(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(testString)))).to.eq(
        testString
      );
    });

    it('bytes32ToAddress', async () => {
      const {deployer: testAddress} = await getNamedAccounts();
      expect(await FormatterV1.bytes32ToAddress(ethers.utils.hexZeroPad(testAddress, 32))).to.eq(testAddress);
    });

    it('bytes32ToUint256', async () => {
      const testNumber = ethers.constants.WeiPerEther.mul(50);
      expect(await FormatterV1.bytes32ToUint256(ethers.utils.hexZeroPad(testNumber.toHexString(), 32))).to.eq(
        testNumber
      );
    });
  });

  describe('TuplerV1', async () => {
    const testInt = ethers.utils.hexZeroPad('0xcafe', 32);
    const testString = ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Hello World!'.repeat(5)));
    const testIntArray =
      '0x' + ['0xcafe', '0xdead', '0xbeef'].map((item) => ethers.utils.hexZeroPad(item, 32).replace('0x', '')).join('');
    let user: {
      address: string;
    } & {
      PortalFactory: PortalFactory;
      Portal: Portal;
    };
    let contracts: Record<string, Contract | weiroll>;

    before(async () => {
      const {
        contracts: {
          utils: {TuplerV1},
          testing: {Events, TupleFactory},
        },
        userWithPortal,
      } = await setup();

      user = userWithPortal;
      contracts = {
        Events: Events,
        wEvents: weiroll.createLibrary(Events as any),
        wTupleFactory: weiroll.createContract(TupleFactory as any),
        wTuplerV1: weiroll.createContract(TuplerV1 as any),
      };
    });

    it('extractElement', async () => {
      const planner = new Planner();
      const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
      const extractedItem = planner.add(contracts.wTuplerV1.extractElement(tuple, 0));
      planner.add(contracts.wEvents.logBytes32(extractedItem));

      const {commands, state} = planner.plan();
      const tx = await user.Portal.execute(commands, state);
      await expect(tx).to.emit(contracts.Events.attach(user.Portal.address), 'LogBytes32').withArgs(testInt);
    });

    it('extractDynamicElement', async () => {
      const planner = new Planner();
      const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
      const extractedItem = planner.add(contracts.wTuplerV1.extractDynamicElement(tuple, 1).rawValue());
      planner.add(contracts.wEvents.logBytes(extractedItem));

      const {commands, state} = planner.plan();
      const tx = await user.Portal.execute(commands, state);
      await expect(tx).to.emit(contracts.Events.attach(user.Portal.address), 'LogBytes').withArgs(testString);
    });

    it('extractArray', async () => {
      const planner = new Planner();
      const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
      const extractedItem = planner.add(contracts.wTuplerV1.extractArray(tuple, 2).rawValue());
      planner.add(contracts.wEvents.logBytes(extractedItem));

      const {commands, state} = planner.plan();
      const tx = await user.Portal.execute(commands, state);
      await expect(tx).to.emit(contracts.Events.attach(user.Portal.address), 'LogBytes').withArgs(testIntArray);
    });

    it('extractDynamicArray', async () => {
      const planner = new Planner();
      const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
      const extractedArray = planner.add(contracts.wTuplerV1.extractDynamicArray(tuple, 3).rawValue());
      const extractedItem = planner.add(contracts.wTuplerV1.extractDynamicElement(extractedArray, 1).rawValue());
      planner.add(contracts.wEvents.logBytes(extractedItem));

      const {commands, state} = planner.plan();
      const tx = await user.Portal.execute(commands, state);
      await expect(tx).to.emit(contracts.Events.attach(user.Portal.address), 'LogBytes').withArgs(testString);
    });

    it('extractTuple', async () => {
      const planner = new Planner();
      const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
      const extractedTuple = planner.add(contracts.wTuplerV1.extractTuple(tuple, 4, [false, true]).rawValue());
      const extractedItem = planner.add(contracts.wTuplerV1.extractElement(extractedTuple, 0));
      planner.add(contracts.wEvents.logBytes32(extractedItem));

      const {commands, state} = planner.plan();
      const tx = await user.Portal.execute(commands, state);
      await expect(tx).to.emit(contracts.Events.attach(user.Portal.address), 'LogBytes32').withArgs(testInt);
    });

    it('extractTupleArray', async () => {
      const planner = new Planner();
      const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
      const extractedTupleArray = planner.add(
        contracts.wTuplerV1.extractTupleArray(tuple, 5, [false, true]).rawValue()
      );
      const extractedTuple = planner.add(
        contracts.wTuplerV1.extractTuple(extractedTupleArray, 1, [false, true]).rawValue()
      );
      const extractedItem = planner.add(contracts.wTuplerV1.extractDynamicElement(extractedTuple, 1).rawValue());
      planner.add(contracts.wEvents.logBytes(extractedItem));

      const {commands, state} = planner.plan();
      const tx = await user.Portal.execute(commands, state);
      await expect(tx).to.emit(contracts.Events.attach(user.Portal.address), 'LogBytes').withArgs(testString);
    });
  });
});
