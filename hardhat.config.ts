import * as dotenv from 'dotenv';
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-tracer';

import {nodeUrl, accounts, addForkConfiguration} from './utils/network';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.16',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 100000000,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
    admin: '0xfae0bbFD75307865Dcdf21d9deFEFEDEee718431',
  },
  networks: addForkConfiguration({
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
      saveDeployments: true,
      accounts: accounts(),
    },
    localhost: {
      url: nodeUrl('localhost'),
      accounts: accounts('localhost'),
    },
    goerli: {
      url: nodeUrl('goerli'),
      accounts: accounts('goerli'),
      saveDeployments: true,
    },
    mainnet: {
      url: nodeUrl('mainnet'),
      accounts: accounts('mainnet'),
      saveDeployments: true,
    },
    arbitrum: {
      url: nodeUrl('arbitrum'),
      accounts: accounts('arbitrum'),
      saveDeployments: true,
    },
    optimism: {
      url: nodeUrl('optimism'),
      accounts: accounts('optimism'),
      saveDeployments: true,
    },
    polygon: {
      url: nodeUrl('polygon'),
      accounts: accounts('polygon'),
      saveDeployments: true,
    },
    bsc: {
      url: nodeUrl('bsc'),
      accounts: accounts('bsc'),
      saveDeployments: true,
    },
    gnosis: {
      url: nodeUrl('gnosis'),
      accounts: accounts('gnosis'),
      saveDeployments: true,
    },
    avalanche: {
      url: nodeUrl('avalanche'),
      accounts: accounts('avalanche'),
      saveDeployments: true,
    },
    fantom: {
      url: nodeUrl('fantom'),
      accounts: accounts('fantom'),
      saveDeployments: true,
    },
    aurora: {
      url: nodeUrl('aurora'),
      accounts: accounts('aurora'),
      saveDeployments: true,
    },
    base: {
      url: nodeUrl('base'),
      accounts: accounts('base'),
      saveDeployments: true,
    },
    linea: {
      url: nodeUrl('linea'),
      accounts: accounts('linea'),
      saveDeployments: true,
    },
    artio: {
      url: nodeUrl('artio'),
      accounts: accounts('artio'),
      saveDeployments: true,
    }
  }),
  paths: {
    sources: 'contracts',
    deployments: 'deployments',
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: Boolean(process.env.REPORT_GAS),
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 0,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },
  external: process.env.HARDHAT_FORK
    ? {
        deployments: {
          // process.env.HARDHAT_FORK will specify the network that the fork is made from.
          // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
          hardhat: ['deployments/' + process.env.HARDHAT_FORK],
          localhost: ['deployments/' + process.env.HARDHAT_FORK],
        },
      }
    : undefined,
};

export default config;
