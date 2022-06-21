import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;

  const {deterministic} = deployments;

  const {deployer} = await getNamedAccounts();

  const {deploy: deployVM, address: vmAddress} = await deterministic('EnsoVM', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployVM();

  const {deploy: deployPortal, address: portalAddress} = await deterministic('Portal', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployPortal();

  const {deploy: deployPortalFactory} = await deterministic('PortalFactory', {
    from: deployer,
    args: [vmAddress, portalAddress],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployPortalFactory();
};
export default func;

func.tags = ['EnsoVM', 'PortalFactory', 'Portal'];
