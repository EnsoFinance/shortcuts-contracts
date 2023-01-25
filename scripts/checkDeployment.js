const { ethers, getNamedAccounts } = require('hardhat')
const dotenv = require("dotenv")

dotenv.config();

const IMPL_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

const networkName = 'localhost'

const EnsoBeacon = require(`../deployments/${networkName}/EnsoBeacon.json`)
const FactoryDeployer = require(`../deployments/${networkName}/FactoryDeployer.json`)
const EnsoWalletFactory = require(`../deployments/${networkName}/EnsoWalletFactory.json`)
const EnsoWallet = require(`../deployments/${networkName}/EnsoWallet.json`)
const MinimalWallet = require(`../deployments/${networkName}/MinimalWallet.json`)

const url = process.env[`ETH_NODE_URI_${networkName.toUpperCase()}`]
const provider = new ethers.providers.JsonRpcProvider(url)

async function main() {
    const namedAccounts = await getNamedAccounts()
    const ensoBeacon = new ethers.Contract(EnsoBeacon.address, EnsoBeacon.abi, provider)
    const factoryDeployer = new ethers.Contract(FactoryDeployer.address, FactoryDeployer.abi, provider)
    const [
        admin,
        coreImplementation,
        fallbackImplementation,
        factoryInBeacon,
        factory
    ]= await Promise.all([
        ensoBeacon.admin(),
        ensoBeacon.coreImplementation(),
        ensoBeacon.fallbackImplementation(),
        ensoBeacon.factory(),
        factoryDeployer.factory()
    ])
    console.log('Factory: ', factory)
    const ensoWalletFactory = new ethers.Contract(factory, EnsoWalletFactory.abi, provider)
    const [factoryImplementationBytes, beacon, factoryOwner] = await Promise.all([
        provider.getStorageAt(factory, IMPL_SLOT),
        ensoWalletFactory.ensoBeacon(),
        ensoWalletFactory.owner()
    ])
    const factoryImplementation = ethers.utils.getAddress('0x' + factoryImplementationBytes.slice(26))
    console.log('Factory implementation: ', factoryImplementation)
    if (namedAccounts.admin == admin) {
        console.log('Admin correct')
    } else {
        console.log('Wrong admin ', admin)
    }
    if (EnsoWallet.address == coreImplementation) {
        console.log('Core implementation correct')
    } else {
        console.log('Wrong core implementation')
    }
    if (MinimalWallet.address == fallbackImplementation) {
        console.log('Fallback implementation correct')
    } else {
        console.log('Wrong fallback implementation')
    }
    if (EnsoWalletFactory.address == factoryImplementation) {
        console.log('Factory implementation correct')
    } else {
        console.log('Wrong factory implementation: ', factoryImplementation)
    }
    if (EnsoBeacon.address == beacon) {
        console.log('Factory beacon correct')
    } else {
        console.log('Wrong factory beacon: ', beacon)
    }
    if (EnsoBeacon.address == factoryOwner) {
        console.log('Factory owner correct')
    } else {
        console.log('Wrong factory owner: ', factoryOwner)
    }
    if (factory == factoryInBeacon) {
        console.log('Factory has been correctly set in beacon')
    } else {
        console.log('Factory needs to be set in the beacon')
    }
}

main()