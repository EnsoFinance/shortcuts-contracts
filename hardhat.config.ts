import * as dotenv from 'dotenv';
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-tracer';

import {nodeUrl, accounts, addForkConfiguration, getChainId} from './utils/network';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: addForkConfiguration({
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
      saveDeployments: true,
      accounts: accounts(),
    },
    localhost: {
      url: nodeUrl('localhost'),
      accounts: accounts(),
      chainId: getChainId(),
    },
    mainnet: {
      url: nodeUrl('mainnet'),
      accounts: accounts('mainnet'),
      saveDeployments: true,
    },
    kovan: {
      url: nodeUrl('kovan'),
      accounts: accounts('kovan'),
      saveDeployments: true,
    },
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
