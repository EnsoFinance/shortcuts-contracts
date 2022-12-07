# Deployment 

## Prerequisites
1. Project installs dependencies with `yarn` and runs tests with `yarn test` without errors.
2. All networks that contracts will be deployed are defined in the `hardhat.config.ts`:

For example:
   ```typescript
   const config: HardhatUserConfig = {
    ...
    networks: addForkConfiguration({
        ...
        arbitrum: {
            url: nodeUrl('arbitrum'),       // RPC endpoint for the network taken from the ETH_NODE_URI_ARBITRUM environment variable
            accounts: accounts('arbitrum'), // list of accounts for the network taken from the MNEMONIC_ARBITRUM environment variable
            saveDeployments: true,          // deployment summary will be saved in the deployments directory
        }
        ...
    }),
    ...
    }
   ```
3. For every network the following environment variables are set in the `.env` file:
    - `MNEMONIC_<network name>` - mnemonic for the deployer account
    - `ETHERSCAN_KEY_<network name>` - etherscan API key for the network
    - `ETH_NODE_URI_<network name>` - RPC endpoint for the network

**Important** current mnemonic is stored in the Enso 1Password as the `V2 Deployer Burner` secure note.

For example:
```
MNEMONIC_MAINNET="test test test test test test test test test test test junk"
ETHERSCAN_KEY_MAINNET="1234567890"
ETH_NODE_URI_MAINNET="http://localhost:8545"
```

4. The deployer account has enough funds to deploy contracts on all networks. The address of the deployer account is taken from the first account of the mnemonic. 

For `V2 Deployer Burner` this address is `0xf754916D90B109AE8E405FD34064cF6Df23947eb`.

## Test the deployment
1. Check if deployment scripts runs without errors:
```bash
yarn void:deploy
``` 

2. Run the deployment on a fork of any network:
```bash 
yarn fork:deploy <network name>[mainnet|arbitrum|polygon|...]
```

Double check if contracts are deployed or reused from a previous deployment. 

## Deployment to a single network
1. Run the deployment using the following command:
```bash
yarn deploy <network name>[mainnet|arbitrum|polygon|...]
```

You can set max and priority fees using the `--maxfee` and `--priorityfee` flags. 

For example:
```bash
yarn deploy mainnet --maxfee 1000000000000000000 --priorityfee 1000000000000000000
```

If network doesn't support EIP-1559 then use `--gasprice` flag instead of `--maxfee` and `--priorityfee`.

For example:
```bash
yarn deploy bsc --gasprice 1000000000000000000
```

## Verify contracts

### Sourcify
Run the verification using the following command:
```bash
yarn verify:sourcify <network name>[mainnet|arbitrum|polygon|...]
```

### Etherscan
Run the verification using the following command:
```bash
yarn verify:etherscan <network name>[mainnet|arbitrum|polygon|...]
```

#### Known Issues
Etherscan APIs are different from each other and sometimes they don't work as expected. Sometimes you need to provide additional options like: `--apiurl`, `--api-key` or `--solc-input` to the `yarn verify:etherscan` command. 

## Prepare summary of the deployment
Run the following command to generate the summary of the deployment:
```bash
yarn export-all
```

Deployment summary will be saved in the `deployments` directory in the following file: `deployments/deployments.json`. 

## Prepare NPM package
1. Increase package version in the `package.json` file.
2. Commit your changes and create a new PR.
3. Package will be deployed to NPM automatically after the PR is merged.

### Publish a alpha version of the NPM package
1. Increase package version in the `package.json` file and add `-alpha` suffix to it.
2. Run the following command to publish the alpha version package to NPM:
```bash
NPM_TOKEN=<npm token with write access> yarn prepare:publish --tag alpha
```