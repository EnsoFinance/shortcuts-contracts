import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import * as weiroll from "@weiroll/weiroll.js";

async function deployLibrary(name: string) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy();
  return weiroll.Contract.createLibrary(contract);
}

describe("VM", function () {
  const testString = "Hello, world!";

  let events: weiroll.Contract,
    vm: Contract,
    math: weiroll.Contract,
    strings: weiroll.Contract,
    stateTest: Contract,
    payable: weiroll.Contract,
    vmLibrary: Contract,
    eventsContract: Contract;

  before(async () => {
    math = await deployLibrary("Math");
    strings = await deployLibrary("Strings");

    eventsContract = await (await ethers.getContractFactory("Events")).deploy();
    events = weiroll.Contract.createLibrary(eventsContract);

    const StateTest = await ethers.getContractFactory("StateTest");
    stateTest = await StateTest.deploy();

    const Payable = await ethers.getContractFactory("Payable");
    payable = weiroll.Contract.createContract(await Payable.deploy());

    const VMLibrary = await ethers.getContractFactory("VM");
    vmLibrary = await VMLibrary.deploy();

    const vmFactory = await ethers.getContractFactory("TestableVM");
    vm = await vmFactory.deploy(vmLibrary.address);
  });

  function execute(commands: any[], state: any[]) {
    const encodedCommands = commands.map(([target, func, inargs, outargs]) =>
      ethers.utils.concat([
        target.interface.getSighash(func),
        inargs,
        outargs,
        target.address,
      ])
    );
    return vm.execute(encodedCommands, state);
  }

  it("Should not allow direct calls", async () => {
    await expect(vmLibrary.execute([], [])).to.be.reverted;
    await vm.execute([], []); // Expect the wrapped one to not revert with same arguments
  });

  it.skip("Should execute a simple addition program", async () => {
    const planner = new weiroll.Planner();
    let a = 1,
      b = 1;
    for (let i = 0; i < 8; i++) {
      const ret = planner.add(math.add(a, b));
      a = b;
      b = Number(ret);
    }
    planner.add(events.logUint(b));
    const { commands, state } = planner.plan();

    const tx = await vm.execute(commands, state);
    await expect(tx)
      .to.emit(eventsContract.attach(vm.address), "LogUint")
      .withArgs(55);

    const receipt = await tx.wait();
    console.log(`Array sum: ${receipt.gasUsed.toNumber()} gas`);
  });

  it("Should execute a string length program", async () => {
    const planner = new weiroll.Planner();
    const len = planner.add(strings.strlen(testString));
    planner.add(events.logUint(len));
    const { commands, state } = planner.plan();

    const tx = await vm.execute(commands, state);
    await expect(tx)
      .to.emit(eventsContract.attach(vm.address), "LogUint")
      .withArgs(13);

    const receipt = await tx.wait();
    console.log(`String concatenation: ${receipt.gasUsed.toNumber()} gas`);
  });

  it("Should concatenate two strings", async () => {
    const planner = new weiroll.Planner();
    const result = planner.add(strings.strcat(testString, testString));
    planner.add(events.logString(result));
    const { commands, state } = planner.plan();

    const tx = await vm.execute(commands, state);
    await expect(tx)
      .to.emit(eventsContract.attach(vm.address), "LogString")
      .withArgs(testString + testString);

    const receipt = await tx.wait();
    console.log(`String concatenation: ${receipt.gasUsed.toNumber()} gas`);
  });

  it("Should sum an array of uints", async () => {
    const planner = new weiroll.Planner();
    const result = planner.add(math.sum([1, 2, 3]));
    planner.add(events.logUint(result));
    const { commands, state } = planner.plan();

    const tx = await vm.execute(commands, state);
    await expect(tx)
      .to.emit(eventsContract.attach(vm.address), "LogUint")
      .withArgs(6);

    const receipt = await tx.wait();
    console.log(`String concatenation: ${receipt.gasUsed.toNumber()} gas`);
  });

  xit("Should call payable with value", async () => {
    const amount = 123;

    const planner = new weiroll.Planner();
    planner.add(payable.pay().withValue(amount));
    const result = planner.add(payable.balance());
    planner.add(events.logUint(result));
    const { commands, state } = planner.plan();

    const tx = await vm.execute(commands, state);
    await expect(tx)
      .to.emit(eventsContract.attach(vm.address), "LogUint")
      .withArgs(amount);

    const receipt = await tx.wait();
    console.log(`Payable function: ${receipt.gasUsed.toNumber()} gas`);
  });

  it("Should pass and return raw state to functions", async () => {
    const commands = [
      [stateTest, "addSlots", "0x00000102feffff", "0xfe"],
      [events, "logUint", "0x0000ffffffffff", "0xff"],
    ];
    const state = [
      // dest slot index
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      // src1 slot index
      "0x0000000000000000000000000000000000000000000000000000000000000003",
      // src2 slot index
      "0x0000000000000000000000000000000000000000000000000000000000000004",
      // src1
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      // src2
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    ];

    const tx = await execute(commands, state);
    await expect(tx)
      .to.emit(eventsContract.attach(vm.address), "LogUint")
      .withArgs(
        "0x0000000000000000000000000000000000000000000000000000000000000003"
      );

    const receipt = await tx.wait();
    console.log(`State passing: ${receipt.gasUsed.toNumber()} gas`);
  });
});