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
