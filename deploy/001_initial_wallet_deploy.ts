import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const ADMIN = '0xfae0bbFD75307865Dcdf21d9deFEFEDEee718431'
const IMPL_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

function wait(n: number){
  return new Promise(function(resolve){
      setTimeout(resolve,n*1000);
  });
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, ethers} = hre;
  const {getContractAt, constants} = ethers
  const {AddressZero} = constants

  const {deterministic, getArtifact, getOrNull} = deployments;

  const {deployer} = await getNamedAccounts();

  const accounts = await ethers.provider.listAccounts();
  console.log('Deployer: ', accounts[0])
  console.log('Admin: ', ADMIN)
  
  const {deploy: deployMinimalWallet, address: MinimalWalletAddress} = await deterministic('MinimalWallet', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployMinimalWallet();

  const {deploy: deployEnsoWallet, address: EnsoWalletAddress} = await deterministic('EnsoWallet', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployEnsoWallet();

  let EnsoBeaconAddress = AddressZero;
  let deployBeacon = true;
  const ensoBeaconDeployment = await getOrNull('EnsoBeacon')
  if (ensoBeaconDeployment) {
    const ensoBeaconArtifact = await getArtifact('EnsoBeacon')
    deployBeacon = ensoBeaconDeployment.bytecode != ensoBeaconArtifact.bytecode
    if (!deployBeacon) EnsoBeaconAddress = ensoBeaconDeployment.address
  }
  if (deployBeacon) {
    const deterministicBeacon = await deterministic('EnsoBeacon', {
      from: deployer,
      args: [ADMIN, EnsoWalletAddress, MinimalWalletAddress],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: true,
    });

    EnsoBeaconAddress = deterministicBeacon.address;

    await deterministicBeacon.deploy();
  }
  
  const {deploy: deployEnsoWalletFactory, address: EnsoWalletFactoryAddress} = await deterministic('EnsoWalletFactory', {
    from: deployer,
    args: [EnsoBeaconAddress],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployEnsoWalletFactory();

  let FactoryDeployerAddress = AddressZero;
  const factoryDeployerDeployment = await getOrNull('FactoryDeployer')
  if (!factoryDeployerDeployment) {
    const deterministicFactoryDeployer = await deterministic('FactoryDeployer', {
      from: deployer,
      args: [EnsoBeaconAddress, EnsoWalletFactoryAddress],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: true,
    });
    FactoryDeployerAddress = deterministicFactoryDeployer.address

    await deterministicFactoryDeployer.deploy();
  } else {
    FactoryDeployerAddress = factoryDeployerDeployment.address;
  }

  const FactoryDeployer = await getContractAt('FactoryDeployer', FactoryDeployerAddress);
  const FactoryProxyAddress = await FactoryDeployer.factory();
  const FactoryProxy = await getContractAt('EnsoWalletFactory', FactoryProxyAddress)

  if (!deployBeacon) {
    const EnsoBeacon = await getContractAt('EnsoBeacon', EnsoBeaconAddress);
    const [
        coreImplementation,
        fallbackImplementation,
        factoryImplementation,
        delay,
        admin
    ] = await Promise.all([
        EnsoBeacon.coreImplementation(),
        EnsoBeacon.fallbackImplementation(),
        ethers.utils.getAddress("0x" + (await ethers.provider.getStorageAt(FactoryProxyAddress, IMPL_SLOT)).slice(26)),
        EnsoBeacon.delay(),
        EnsoBeacon.admin()
    ])
    const upgradeCore = coreImplementation != EnsoWalletAddress;
    const upgradeFallback = fallbackImplementation != MinimalWalletAddress;
    const upgradeFactory = factoryImplementation != EnsoWalletFactoryAddress;
    if (upgradeCore || upgradeFallback || upgradeFactory) {
      const adminSigner = await ethers.getSigner(admin);
      if (upgradeCore) {
          if (upgradeFactory) {
            const [factoryAddress, factoryOwner] = await Promise.all([
              EnsoBeacon.factory(),
              FactoryProxy.owner()
            ])
            if (factoryAddress != FactoryProxyAddress) {
              await EnsoBeacon.connect(adminSigner).setFactory(FactoryProxyAddress);
            }
            if (factoryOwner != EnsoBeaconAddress) {
              const ownerSigner = await ethers.getSigner(factoryOwner);
              await FactoryProxy.connect(ownerSigner).transferOwnership(EnsoBeaconAddress);
              await EnsoBeacon.connect(adminSigner).acceptOwnership(FactoryProxyAddress);
            }
            await EnsoBeacon.connect(adminSigner).upgradeCore(EnsoWalletAddress, EnsoWalletFactoryAddress, '0x');
          } else {
            await EnsoBeacon.connect(adminSigner).upgradeCore(EnsoWalletAddress, AddressZero, '0x');
          }
      } else if (upgradeFactory) {
        const [factoryAddress, factoryOwner] = await Promise.all([
          EnsoBeacon.factory(),
          FactoryProxy.owner()
        ])
        if (factoryAddress != FactoryProxyAddress) {
          await EnsoBeacon.connect(adminSigner).setFactory(FactoryProxyAddress);
        }
        if (factoryOwner != EnsoBeaconAddress) {
          const ownerSigner = await ethers.getSigner(factoryOwner);
          await FactoryProxy.connect(ownerSigner).transferOwnership(EnsoBeaconAddress);
          await EnsoBeacon.connect(adminSigner).acceptOwnership(FactoryProxyAddress);
        }
        await EnsoBeacon.connect(adminSigner).upgradeFactory(EnsoWalletFactoryAddress, '0x');
      }
      if (upgradeFallback) {
        await EnsoBeacon.connect(adminSigner).upgradeFallback(MinimalWalletAddress);
      }
      // wait for delay (only if delay is short)
      if (delay.lte(60)) {
        await wait(delay.toNumber());
        if (upgradeCore) await EnsoBeacon.connect(adminSigner).finalizeCore();
        if (upgradeFallback) await EnsoBeacon.connect(adminSigner).finalizeFallback();
      }
    }
  }
};
export default func;
func.tags = ['EnsoWallet'];
