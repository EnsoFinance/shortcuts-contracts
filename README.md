# Enso V2 Contracts

# Install
Before installation you need to have a `.env` file with following variables:
```
ETH_NODE_URI_MAINNET=
ETHERSCAN_KEY=
```

To install all dependencies run:
```bash
yarn
```

This will also fetch all ABIs for external contracts defined in `eth-sdk/config.ts`

# Tests
To run tests:
```bash
yarn test
```

Test can use deployments as a fixture. Check the function `setup` in the `test/utils/index.ts` directory.

# Deployments
This repo uses `hardhat-deployments` to create deploy scripts in the `deploy` directory. 

Deployments summary for each network are in the `deployments` directory.

## Test deployment scripts
```bash
yarn void:deploy
```

## Deploy 
```bash
yarn deploy <network name>[hardhat|localhost|mainnet|kovan]
```

## Verify contracts 
To verify all contracts on Etherscan run:
```bash
yarn verify
```

# Enso Actions Prototype

To prototype an Enso Action you need to do following steps: 

## 1. Define external contracts:
Put external contracts addresses on given network in `eth-sdk/config.ts` file.

## 2. Fetch ABIs and create clients for external contracts
Run
```bash
yarn prepare
```

## 3. Create an action in the `actions-playground` directory

You can reuse `v2-contracts` deployment fixtures by using `setup` function from `test/utils/index.ts`

You can impersonate any account using `impersonateAccount` function from `test/utils/index.ts`

## 4. Run actions on forked mainnet
Run
```bash
yarn test:actions
```