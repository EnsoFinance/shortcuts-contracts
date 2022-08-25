import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;

  const {deterministic, execute, deploy} = deployments;

  const {deployer} = await getNamedAccounts();

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
    args: [portalAddress],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployPortalFactory();

  const {deploy: deployBalance} = await deterministic('BalanceV1', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployBalance();
};
export default func;
func.tags = ['PortalFactory', 'Portal'];
