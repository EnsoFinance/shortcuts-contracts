import {Contract} from 'ethers';
import {ethers} from 'hardhat';
import {Portal, PortalFactory} from '../../typechain';

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
