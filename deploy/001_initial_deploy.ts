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

  const {deploy: deployBalance, address: balanceAddress} = await deterministic('Balance', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployBalance();

  await deploy('Utils', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await execute(
    'Utils',
    {
      from: deployer,
      log: true,
      autoMine: true,
    },
    'updateUtils',
    'Balance',
    balanceAddress
  );
};
export default func;
func.tags = ['PortalFactory', 'Portal'];
