import {defineConfig} from '@dethcrypto/eth-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  contracts: {
    mainnet: {
      stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      dai: '0x6b175474e89094c44da98b954eedeac495271d0f',
      euler: {
        markets: {
          proxy: '0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3',
          implementation: '0xE5d0A7A3ad358792Ba037cB6eE375FfDe7Ba2Cd1',
        },
      },
    },
  },
  etherscanKeys: {
    mainnet: process.env.ETHERSCAN_KEY,
  },
  rpc: {
    mainnet: process.env.ETH_NODE_URI_MAINNET,
  },
  outputPath: './eth-sdk/types',
});
