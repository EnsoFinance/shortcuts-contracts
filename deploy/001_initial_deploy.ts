import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;

  const {deterministic} = deployments;

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

  const {deploy: deployBasicV1} = await deterministic('BasicV1', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployBasicV1();

  const {deploy: deployTuplerV1} = await deterministic('TuplerV1', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployTuplerV1();

  const {deploy: deployFormatterV1} = await deterministic('FormatterV1', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployFormatterV1();
};
export default func;
func.tags = ['PortalFactory', 'Portal'];
