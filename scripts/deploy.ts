const hre = require("hardhat");

async function main() {
  const VM = await hre.ethers.getContractFactory("VM");
  const vm = await VM.deploy();

  const TESTABLE_VM = await hre.ethers.getContractFactory("TestableVM");
  const testableVm = await TESTABLE_VM.deploy(vm.address);

  console.log("Testable weiroll vm deployed to:", testableVm.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
