# Enso V2 Contracts

# Install
Before installation you need to have a `.env` file with following variables:
```
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

# Deployment
This repo uses [hardhat-deploy](https://github.com/wighawag/hardhat-deploy) to create deploy scripts in the `deploy` directory. 

Example of a deployment script:
```typescript
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;

  const {deterministic, deploy} = deployments;

  const {deploy: deployEnsoWalletFactory} = await deterministic('EnsoWalletFactory', {
    from: deployer,
    args: [EnsoBeaconAddress],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  await deployEnsoWalletFactory();
};
export default func;

func.tags = ['EnsoWalletFactory'];
```

Deployments summary for each network are in the `deployments` directory.

## Test deployment scripts
To check if deployment scripts are valid run:
```bash
yarn void:deploy
```

To check how deployment scripts will behave on live network run:
```bash
yarn fork:deploy <network name>[hardhat|localhost|mainnet]
```

## Deploy 
```bash
yarn deploy <network name>[hardhat|localhost|mainnet]
```

## Verify contracts 
To verify all contracts on Etherscan run:
```bash
yarn verify
```