module.exports = {
  istanbulFolder: './coverage-hardhat',
  skipFiles: ['test', 'libraries/Clones.sol', 'libraries/UpgradeableClones.sol', 'proxy/BeaconProxy.sol', 'proxy/BeaconProxyTemplate.sol', 'proxy/UpgradeableProxyTemplate.sol']
};
