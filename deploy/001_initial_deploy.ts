import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;

  const {deterministic, deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  const {deploy: deployVM, address: vmAddress} = await deterministic('EnsoVM', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployVM();

  const portalDeployment = await deploy('Portal', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  const {deploy: deployPortalFactory} = await deterministic('PortalFactory', {
    from: deployer,
    args: [vmAddress, portalDeployment.address],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployPortalFactory();
};
export default func;
func.tags = ['EnsoVM', 'PortalFactory', 'Portal'];
