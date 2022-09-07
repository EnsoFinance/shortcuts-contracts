import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;

  const {deterministic} = deployments;

  const {deployer} = await getNamedAccounts();

  const {deploy: deployEnsoWallet, address: EnsoWalletAddress} = await deterministic('EnsoWallet', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployEnsoWallet();

  const {deploy: deployEnsoWalletFactory} = await deterministic('EnsoWalletFactory', {
    from: deployer,
    args: [EnsoWalletAddress],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployEnsoWalletFactory();

  const {deploy: deployEnsoShortcutsHelper} = await deterministic('EnsoShortcutsHelper', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployEnsoShortcutsHelper();
};
export default func;
func.tags = ['EnsoWalletFactory', 'EnsoWallet', 'EnsoShortcutsHelper'];
