import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {VM__factory, PortalFactory__factory, Portal__factory} from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, ethers, network} = hre;
  const {deterministic, deploy} = deployments;

  const {deployer} = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  const {deploy: deployVM, address: vmAddress} = await deterministic('VM', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deployVM();
  const vm = VM__factory.connect(vmAddress, deployerSigner);

  const portalDeployment = await deploy('Portal', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  const portal = Portal__factory.connect(portalDeployment.address, deployerSigner);

  const {deploy: deployPortalFactory, address: portalFactoryAddress} = await deterministic('PortalFactory', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deployPortalFactory();
  const portalFactory = PortalFactory__factory.connect(portalFactoryAddress, deployerSigner);

  const init = portal.interface.encodeFunctionData('initialize', [deployer, [], []]);
  const tx = await portalFactory.deploy(init);
  const receipt = await tx.wait();
  const deployedEvent = receipt.events?.find((e) => e.event === 'Deployed');

  if (!deployedEvent) {
    throw new Error('Portal for Deployer was not created');
  }

  console.log(`Created Portal ${deployedEvent.args?.instance} for deployer ${deployer}`);
};
export default func;
func.tags = ['VM', 'PortalFactory', 'Portal'];
