import * as crypto from 'crypto';
import {expect} from '../test/chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BigNumber} from 'ethers';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';

import {setup, impersonateAccount, forwardBlockchainTime} from '../test/utils';

const setupRegisterEnsAction = async () => {
  const baseSetup = await setup();

  return {
    ...baseSetup,
  };
};

export const randomSecret = () => {
  return '0x' + crypto.randomBytes(32).toString('hex');
};

describe('Register ENS Action', function () {
  it('should register ENS domain without Portal', async () => {
    const {userWithPortal} = await setupRegisterEnsAction();

    const userSigner = await ethers.getSigner(userWithPortal.address);
    const sdk = getMainnetSdk(userSigner);

    const controller = sdk.ens.controller;
    const registry = sdk.ens.registry;
    const resolver = sdk.ens.resolver;
    const baseRegistrar = sdk.ens.baseRegistrar;

    const secret = randomSecret();
    const name = 'enso-actions.eth';
    const namehash = ethers.utils.namehash(name);
    const duration = 365 * 24 * 60 * 60;

    const isAvailable = await controller.available(name);
    expect(isAvailable).to.be.true;

    const commitment = await controller.makeCommitmentWithConfig(
      name,
      userWithPortal.address,
      secret,
      resolver.address,
      userWithPortal.address
    );
    const commitTx = await controller.commit(commitment, {
      gasLimit: 100000,
    });

    await commitTx.wait();

    await forwardBlockchainTime(3600);

    const price = await controller.rentPrice(name, duration);

    const registerTx = await controller.registerWithConfig(
      name,
      userWithPortal.address,
      duration,
      secret,
      resolver.address,
      userWithPortal.address,
      {
        value: price,
        gasLimit: 1000000,
      }
    );

    await registerTx.wait();

    const isAvailableAfterRegistration = await controller.available(name);
    expect(isAvailableAfterRegistration).to.be.false;

    const ensOwned = await baseRegistrar.balanceOf(userWithPortal.address);
    expect(ensOwned).to.be.eq(1);
  });

  it('should register ENS domain with Portal', async () => {
    const {userWithPortal: user} = await setupRegisterEnsAction();

    const userSigner = await ethers.getSigner(user.address);
    const sdk = getMainnetSdk(userSigner);

    const commitmentPlanner = new Planner();
    const controller = sdk.ens.controller;
    const weirolledController = weiroll.createContract(controller);

    const secret = randomSecret();
    const name = 'enso-actions-weiroll.eth';
    const duration = 365 * 24 * 60 * 60;
    const isAvailable = await controller.available(name);
    expect(isAvailable).to.be.true;

    const commitment = await controller.makeCommitment(name, user.Portal.address, secret);

    commitmentPlanner.add(weirolledController.commit(commitment));
    const {commands: commitmentCommands, state: commitmentState} = commitmentPlanner.plan();

    const commitmentTx = await user.Portal.execute(commitmentCommands, commitmentState);
    await commitmentTx.wait();

    await forwardBlockchainTime(3600);
    const price = await controller.rentPrice(name, duration);

    const registerPlanner = new Planner();
    registerPlanner.add(weirolledController.register(name, user.Portal.address, duration, secret).withValue(price));

    const {commands: registerCommands, state: registerState} = registerPlanner.plan();

    const registerTx = await user.Portal.execute(registerCommands, registerState, {
      value: price,
    });

    await registerTx.wait();
    const isAvailableAfterRegistration = await controller.available(name);
    expect(isAvailableAfterRegistration).to.be.false;
  });

  it('should register ENS domain and create subdomains with Portal', async () => {
    const {userWithPortal: user} = await setupRegisterEnsAction();

    const userSigner = await ethers.getSigner(user.address);
    const sdk = getMainnetSdk(userSigner);
    const controller = sdk.ens.controller;
    const registry = sdk.ens.registry;
    const resolver = sdk.ens.resolver;

    const commitmentPlanner = new Planner();
    const weirolledController = weiroll.createContract(controller);
    const weirolledRegistry = weiroll.createContract(registry);

    const secret = randomSecret();
    const name = 'enso-actions-weiroll.eth';
    const duration = 365 * 24 * 60 * 60;
    const isAvailable = await controller.available(name);
    expect(isAvailable).to.be.true;

    const commitment = await controller.makeCommitment(name, user.Portal.address, secret);

    commitmentPlanner.add(weirolledController.commit(commitment));
    const {commands: commitmentCommands, state: commitmentState} = commitmentPlanner.plan();

    const commitmentTx = await user.Portal.execute(commitmentCommands, commitmentState);
    await commitmentTx.wait();

    await forwardBlockchainTime(3600);
    const price = await controller.rentPrice(name, duration);

    const registerPlanner = new Planner();
    registerPlanner.add(weirolledController.register(name, user.Portal.address, duration, secret).withValue(price));
    // registerPlanner.add(weirolledRegistry.setResolver(namehash(name), resolver.address));

    const {commands: registerCommands, state: registerState} = registerPlanner.plan();

    const registerTx = await user.Portal.execute(registerCommands, registerState, {
      value: price,
    });

    const a = await registerTx.wait();

    // const tx = await registry.setResolver(namehash(name), resolver.address, {
    //   gasLimit: 100000,
    // });
    // await tx.wait();

    const isAvailableAfterRegistration = await controller.available(name);
    expect(isAvailableAfterRegistration).to.be.false;

    const namehash = ethers.utils.namehash(name);

    const ensOwner = await registry.owner(namehash);
    expect(ensOwner).to.be.eq(user.address);
  });
});
