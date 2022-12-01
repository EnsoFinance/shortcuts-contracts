import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;

  const {deterministic} = deployments;

  const {deployer} = await getNamedAccounts();

  const {deploy: deployEnsoShortcutsHelpers} = await deterministic('EnsoShortcutsHelpers', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployEnsoShortcutsHelpers();

  const {deploy: deployMathHelpers} = await deterministic('MathHelpers', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployMathHelpers();

  const {deploy: deploySignedMathHelpers} = await deterministic('SignedMathHelpers', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deploySignedMathHelpers();

  const {deploy: deployPercentageMathHelpers} = await deterministic('PercentageMathHelpers', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployPercentageMathHelpers();

  const {deploy: deployTupleHelpers} = await deterministic('TupleHelpers', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployTupleHelpers();
};
export default func;
func.tags = ['Helpers'];
