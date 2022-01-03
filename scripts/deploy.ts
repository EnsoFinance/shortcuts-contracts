const hre = require("hardhat");

async function main() {
  const EXECUTOR = await hre.ethers.getContractFactory("Executor");
  const executor = await EXECUTOR.deploy();

  const TESTABLE_EXECUTOR = await hre.ethers.getContractFactory(
    "TestableExecutor"
  );
  const testableExecutor = await TESTABLE_EXECUTOR.deploy(executor.address);

  console.log(
    "Testable weiroll executor deployed to:",
    testableExecutor.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
