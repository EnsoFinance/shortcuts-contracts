import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {PortalFactory__factory, Portal__factory, IVM__factory} from '../typechain';
import fs from 'fs';

import DEPLOYMENTS_JSON from '../deployments.json';
const deployments: {[key: string]: {[key: string]: string}} = DEPLOYMENTS_JSON;
const contracts: {[key: string]: string} = {};
let hardhatNetwork: string;

// If true it will deploy contract regardless of whether there is an address currently on the network
let overwrite = false;

const registerDeployment = (contractTitle: string, address: string) => {
  contracts[contractTitle] = address;
  console.log(`Deployed & Registered ${contractTitle}: ${address} 🚀`);
  const data = JSON.stringify(
    hardhatNetwork === 'localhost' ? contracts : {...deployments, [hardhatNetwork]: contracts},
    null,
    2
  );
  fs.writeFileSync(hardhatNetwork === 'localhost' ? './local.deployments.json' : './deployments.json', data);
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, ethers, network} = hre;
  hardhatNetwork = network.name;
  overwrite = hardhatNetwork === 'localhost' ? true : hardhatNetwork === 'mainnet' ? false : overwrite;

  const {deterministic, deploy} = deployments;

  const {deployer} = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  const {deploy: deployVM, address: vmAddress} = await deterministic('EnsoVM', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deployVM();
  const vm = IVM__factory.connect(vmAddress, deployerSigner);

  const portalDeployment = await deploy('Portal', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  const portal = Portal__factory.connect(portalDeployment.address, deployerSigner);

  if (overwrite || !contracts['PortalFactory']) {
    const {deploy: deployPortalFactory, address: portalFactoryAddress} = await deterministic('PortalFactory', {
      from: deployer,
      args: [vm.address, portal.address],
      log: true,
      autoMine: true,
    });

    await deployPortalFactory();
    registerDeployment('PortalFactory', portalFactoryAddress);
    const portalFactory = PortalFactory__factory.connect(portalFactoryAddress, deployerSigner);

    const tx = await portalFactory.deploy([], [], {
      gasLimit: 227800,
    });
    const receipt = await tx.wait();
    const deployedEvent = receipt.events?.find((e) => e.event === 'Deployed');

    if (!deployedEvent) {
      throw new Error('Portal for Deployer was not created');
    }

    console.log(`Created Portal ${deployedEvent.args?.instance} for deployer ${deployer}`);
  }
};
export default func;
func.tags = ['VM', 'PortalFactory', 'Portal'];
