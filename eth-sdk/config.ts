import {defineConfig} from '@dethcrypto/eth-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  contracts: {
    mainnet: {
      usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      dai: '0x6b175474e89094c44da98b954eedeac495271d0f',
      stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      euler: {
        markets: {
          proxy: '0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3',
          implementation: '0xE5d0A7A3ad358792Ba037cB6eE375FfDe7Ba2Cd1',
        },
        exec: {
          proxy: '0x59828FdF7ee634AaaD3f58B19fDBa3b03E2D9d80',
          implementation: '0x14cBaC4eC5673DEFD3968693ebA994F07F8436D2',
        },
        swap: {
          proxy: '0x7123C8cBBD76c5C7fCC9f7150f23179bec0bA341',
          implementation: '0xf40e8314143B4CF1764CCCd22588a8794a00d8Ca',
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
  outputPath: './eth-sdk/sdk',
});
