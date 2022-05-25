import * as hre from 'hardhat';
import * as fs from 'fs';

import DEPLOYMENTS_JSON from '../deployments.json';
const deployments: {[key: string]: {[key: string]: string}} = DEPLOYMENTS_JSON;
let contracts: {[key: string]: string} = {};
let network: string;

// If true it will deploy contract regardless of whether there is an address currently on the network
let overwrite = false;

if (process.env.HARDHAT_NETWORK) {
  network = process.env.HARDHAT_NETWORK;
  //ts-ignore
  if (deployments[network]) contracts = deployments[network];
  if (network === 'localhost') overwrite = true; // Overwrite on localhost
  if (network === 'mainnet') overwrite = false; // Don't overwrite on mainnet
}

const registerDeployment = (contractTitle: string, address: string) => {
  contracts[contractTitle] = address;
  console.log(`Deployed & Registered ${contractTitle}: ${address} 🚀`);
  const data = JSON.stringify(network === 'localhost' ? contracts : {...deployments, [network]: contracts}, null, 2);
  fs.writeFileSync(network === 'localhost' ? './local.deployments.json' : './deployments.json', data);
};

async function main() {
  const VM = await hre.ethers.getContractFactory('VM');
  console.log('Deployed VM:', (await VM.deploy()).address);

  const PORTAL = await hre.ethers.getContractFactory('Portal');
  console.log('Deployed Portal:', (await PORTAL.deploy()).address);

  const portalFactoryContractName = 'PortalFactory';
  if (overwrite || !contracts[portalFactoryContractName]) {
    const PORTAL_FACTORY = await hre.ethers.getContractFactory(portalFactoryContractName);
    const PortalFactory = await PORTAL_FACTORY.deploy();
    registerDeployment(portalFactoryContractName, PortalFactory.address);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
