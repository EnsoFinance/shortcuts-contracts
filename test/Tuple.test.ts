import {expect} from './chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {TupleHelpers, EnsoWallet, EnsoWalletFactory} from '../typechain';
import {setup} from './utils';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {Contract} from 'ethers';

describe('TupleHelpers', async () => {
  const testInt = ethers.utils.hexZeroPad('0xcafe', 32);
  const testString = ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Hello World!'.repeat(5))).padEnd(130, '0'); //64 bytes * 2 char/byte + 2 (0x)
  const testIntArray =
    '0x' + ['0xcafe', '0xdead', '0xbeef'].map((item) => ethers.utils.hexZeroPad(item, 32).replace('0x', '')).join('');
  let user: {
    address: string;
  } & {
    EnsoWalletFactory: EnsoWalletFactory;
    EnsoWallet: EnsoWallet;
  };
  let contracts: Record<string, Contract | weiroll>;

  before(async () => {
    const {
      contracts: {
        utils: {TupleHelpers},
        testing: {Events, TupleFactory},
      },
      userWithEnsoWallet,
    } = await setup();

    user = userWithEnsoWallet;
    contracts = {
      Events: Events,
      wEvents: weiroll.createLibrary(Events as any),
      wTupleFactory: weiroll.createContract(TupleFactory as any),
      wTupleHelpers: weiroll.createContract(TupleHelpers as any),
    };
  });

  it('extractElement', async () => {
    const planner = new Planner();
    const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
    const extractedItem = planner.add(contracts.wTupleHelpers.extractElement(tuple, 0));
    planner.add(contracts.wEvents.logBytes32(extractedItem));

    const {commands, state} = planner.plan();
    const tx = await user.EnsoWallet.execute(commands, state);
    await expect(tx).to.emit(contracts.Events.attach(user.EnsoWallet.address), 'LogBytes32').withArgs(testInt);
  });

  it('extractDynamicElement', async () => {
    const planner = new Planner();
    const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
    const extractedItem = planner.add(contracts.wTupleHelpers.extractDynamicElement(tuple, 1).rawValue());
    planner.add(contracts.wEvents.logBytes(extractedItem));

    const {commands, state} = planner.plan();
    const tx = await user.EnsoWallet.execute(commands, state);
    await expect(tx).to.emit(contracts.Events.attach(user.EnsoWallet.address), 'LogBytes').withArgs(testString);
  });

  it('extractArray', async () => {
    const planner = new Planner();
    const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
    const extractedItem = planner.add(contracts.wTupleHelpers.extractArray(tuple, 2).rawValue());
    planner.add(contracts.wEvents.logBytes(extractedItem));

    const {commands, state} = planner.plan();
    const tx = await user.EnsoWallet.execute(commands, state);
    await expect(tx).to.emit(contracts.Events.attach(user.EnsoWallet.address), 'LogBytes').withArgs(testIntArray);
  });

  it('extractDynamicArray', async () => {
    const planner = new Planner();
    const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
    const extractedArray = planner.add(contracts.wTupleHelpers.extractDynamicArray(tuple, 3).rawValue());
    const extractedItem = planner.add(contracts.wTupleHelpers.extractDynamicElement(extractedArray, 1).rawValue());
    planner.add(contracts.wEvents.logBytes(extractedItem));

    const {commands, state} = planner.plan();
    const tx = await user.EnsoWallet.execute(commands, state);
    await expect(tx).to.emit(contracts.Events.attach(user.EnsoWallet.address), 'LogBytes').withArgs(testString);
  });

  it('extractTuple', async () => {
    const planner = new Planner();
    const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
    const extractedTuple = planner.add(contracts.wTupleHelpers.extractTuple(tuple, 4, [false, true]).rawValue());
    const extractedItem = planner.add(contracts.wTupleHelpers.extractElement(extractedTuple, 0));
    planner.add(contracts.wEvents.logBytes32(extractedItem));

    const {commands, state} = planner.plan();
    const tx = await user.EnsoWallet.execute(commands, state);
    await expect(tx).to.emit(contracts.Events.attach(user.EnsoWallet.address), 'LogBytes32').withArgs(testInt);
  });

  it('extractTupleArray', async () => {
    const planner = new Planner();
    const tuple = planner.add(contracts.wTupleFactory.allTypesTuple().rawValue());
    const extractedTupleArray = planner.add(
      contracts.wTupleHelpers.extractTupleArray(tuple, 5, [false, true]).rawValue()
    );
    const extractedTuple = planner.add(
      contracts.wTupleHelpers.extractTuple(extractedTupleArray, 1, [false, true]).rawValue()
    );
    const extractedItem = planner.add(contracts.wTupleHelpers.extractDynamicElement(extractedTuple, 1).rawValue());
    planner.add(contracts.wEvents.logBytes(extractedItem));

    const {commands, state} = planner.plan();
    const tx = await user.EnsoWallet.execute(commands, state);
    await expect(tx).to.emit(contracts.Events.attach(user.EnsoWallet.address), 'LogBytes').withArgs(testString);
  });
});
