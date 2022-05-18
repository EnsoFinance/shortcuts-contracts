const hre = require("hardhat");
const fs = require("fs");

const DEPLOYMENTS_JSON = require("../deployments.json");
const deployments: { [key: string]: { [key: string]: string } } =
  DEPLOYMENTS_JSON;
let contracts: { [key: string]: string } = {};
let network: string;

// If true it will deploy contract regardless of whether there is an address currently on the network
let overwrite = false;

if (process.env.HARDHAT_NETWORK) {
  network = process.env.HARDHAT_NETWORK;
  //ts-ignore
  if (deployments[network]) contracts = deployments[network];
  if (network === "localhost") overwrite = true; // Overwrite on localhost
  if (network === "mainnet") overwrite = false; // Don't overwrite on mainnet
}

const registerDeployment = (contractTitle: string, address: string) => {
  contracts[contractTitle] = address;
  console.log(`Deployed ${contractTitle}: ${address} 🚀`);
  const data = JSON.stringify(
    { ...deployments, [network]: contracts },
    null,
    2
  );
  fs.writeFileSync("./deployments.json", data);
};

async function main() {
  const VM = await hre.ethers.getContractFactory("VM");
  const vm = await VM.deploy();

  const contractName = "TestableVM";
  if (overwrite || !contracts[contractName]) {
    const TESTABLE_VM = await hre.ethers.getContractFactory(contractName);
    const testableVm = await TESTABLE_VM.deploy(vm.address);
    registerDeployment(contractName, testableVm.address);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
