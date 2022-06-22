import {Contract, Signer} from 'ethers';
import {ethers, deployments, getNamedAccounts, getUnnamedAccounts, network} from 'hardhat';
import {Portal, PortalFactory, Events, EnsoVM} from '../../typechain';

export async function setupUsers<T extends {[contractName: string]: Contract}>(
  addresses: string[],
  contracts: T
): Promise<({address: string} & T)[]> {
  const users: ({address: string} & T)[] = [];
  for (const address of addresses) {
    users.push(await setupUser(address, contracts));
  }
  return users;
}

export async function setupUser<T extends {[contractName: string]: Contract}>(
  address: string,
  contracts: T
): Promise<{address: string} & T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = {address};
  for (const key of Object.keys(contracts)) {
    user[key] = contracts[key].connect(await ethers.getSigner(address));
  }

  return user as {address: string} & T;
}

export async function setupUserWithPortal<
  T extends {[contractName: string]: Contract; Portal: Portal; PortalFactory: PortalFactory}
>(address: string, contracts: T): Promise<{address: string} & T> {
  const user = await setupUser(address, contracts);
  const portalAddress = await user['PortalFactory'].getAddress();
  user['Portal'] = contracts.Portal.attach(portalAddress).connect(await ethers.getSigner(address));
  return user;
}

export async function setupUsersWithPortals<
  T extends {[contractName: string]: Contract; Portal: Portal; PortalFactory: PortalFactory}
>(addresses: string[], contracts: T): Promise<({address: string} & T)[]> {
  const users: ({address: string} & T)[] = [];
  for (const address of addresses) {
    users.push(await setupUserWithPortal(address, contracts));
  }
  return users;
}

export const setup = deployments.createFixture(async () => {
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
  };

  const [user, ...users] = await setupUsersWithPortals(await getUnnamedAccounts(), contracts);

  const deployerUser = await setupUserWithPortal(deployer, contracts);
  await deployerUser.PortalFactory.deploy([], []);

  return {
    ...contracts,
    users,
    userWithPortal: deployerUser,
    userWithoutPortal: user,
  };
});

export async function impersonateAccount(address: string): Promise<Signer> {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });

  const signer = await ethers.getSigner(address);

  return signer;
}
