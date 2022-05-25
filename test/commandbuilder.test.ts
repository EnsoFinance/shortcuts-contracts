import { expect } from "chai";
import { ethers } from "hardhat";
import * as weiroll from "@weiroll/weiroll.js";
import { Contract } from "ethers";

async function deployLibrary(name: string) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy();
  return weiroll.Contract.createLibrary(contract);
}

describe("CommandBuilder", function () {
  let cbh: Contract;
  let math: weiroll.Contract;
  let strings: weiroll.Contract;
  const abi = ethers.utils.defaultAbiCoder;

  before(async () => {
    const Cbh = await ethers.getContractFactory("CommandBuilderHarness");
    cbh = await Cbh.deploy();
    math = await deployLibrary("Math");
    strings = await deployLibrary("Strings");
  });

  async function executeBuildInputs(
    commands: string[],
    state: string[],
    abiout: string,
    msg: string
  ) {
    for (const c of commands) {
      const selector = ethers.utils.hexDataSlice(c, 0, 4);
      const indices = ethers.utils.hexConcat([
        ethers.utils.hexDataSlice(c, 5, 5 + 6),
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffff",
      ]);
      const target = ethers.utils.hexDataSlice(c, 5 + 6);
      const txBaseGasNoArgs = await cbh.estimateGas.basecall();
      const txBaseGas = await cbh.estimateGas.testBuildInputsBaseGas(
        state,
        selector,
        indices
      );
      const txGas = await cbh.estimateGas.testBuildInputs(
        state,
        selector,
        indices
      );
      console.log(
        `buildInputs gas cost: ${txGas
          .sub(txBaseGas)
          .toString()} - argument passing cost: ${txBaseGas
          .sub(txBaseGasNoArgs)
          .toNumber()} - total: ${txGas.toNumber()}`
      );
      const result = await cbh.testBuildInputs(state, selector, indices);
      expect(result).to.equal(selector + abiout.slice(2));
    }
  }

  it("Should build inputs that match Math.add ABI", async () => {
    const planner = new weiroll.Planner();

    const args = [1, 2];

    const abiout = abi.encode(math.interface.getFunction("add").inputs, args);

    planner.add(math.add(...args));

    const { commands, state } = planner.plan();

    await executeBuildInputs(commands, state, abiout, "Math.add");
  });

  it("Should build inputs that match Strings.strcat ABI", async () => {
    const planner = new weiroll.Planner();

    const args = ["Hello", " World!"];

    const abiout = abi.encode(
      strings.interface.getFunction("strcat").inputs,
      args
    );

    planner.add(strings.strcat(...args));

    const { commands, state } = planner.plan();

    await executeBuildInputs(commands, state, abiout, "Strings.strcat");
  });

  it("Should build inputs that match Math.sum ABI", async () => {
    const planner = new weiroll.Planner();

    const args = [
      ethers.BigNumber.from(
        "0xAAA0000000000000000000000000000000000000000000000000000000000002"
      ),
      ethers.BigNumber.from(
        "0x1111111111111111111111111111111111111111111111111111111111111111"
      ),
      ethers.BigNumber.from(
        "0x2222222222222222222222222222222222222222222222222222222222222222"
      ),
    ];

    const abiout = abi.encode(math.interface.getFunction("sum").inputs, [args]);

    planner.add(math.sum(args));

    const { commands, state } = planner.plan();

    await executeBuildInputs(commands, state, abiout, "Math.sum");
  });

  it("Should select and overwrite first 32 byte slot in state for output (static test)", async () => {
    const state = [
      "0x000000000000000000000000000000000000000000000000000000000000000a",
      "0x1111111111111111111111111111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222222222222222222222222222",
    ];

    const index = "0x00";

    const output =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    const txBaseGas = await cbh.estimateGas.testWriteOutputsBaseGas(
      state,
      index,
      output
    );
    const txGas = await cbh.estimateGas.testWriteOutputs(state, index, output);
    console.log("writeOutputs gas cost: ", txGas.sub(txBaseGas).toString());
    const tx = await cbh.testWriteOutputs(state, index, output);

    state[0] = output;

    expect(tx).to.deep.equal([state, output]);
  });

  it("Should select and overwrite second dynamic amount bytes in second state slot given a uint[] output (dynamic test)", async () => {
    const state = [
      "0x000000000000000000000000000000000000000000000000000000000000000a",
      "0x1111111111111111111111111111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222222222222222222222222222",
    ];

    const index = "0x81";

    const output = abi.encode(["uint[]"], [[1, 2, 3]]);

    const txBaseGas = await cbh.estimateGas.testWriteOutputsBaseGas(
      state,
      index,
      output
    );
    const txGas = await cbh.estimateGas.testWriteOutputs(state, index, output);
    console.log("writeOutputs gas cost: ", txGas.sub(txBaseGas).toString());
    const tx = await cbh.testWriteOutputs(state, index, output);

    state[1] = ethers.utils.hexDataSlice(output, 32);

    expect(tx[0]).to.deep.equal(state);
  });

  it("Should overwrite entire state with *abi decoded* output value (rawcall)", async () => {
    const state = [
      "0x000000000000000000000000000000000000000000000000000000000000000a",
      "0x1111111111111111111111111111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222222222222222222222222222",
    ];

    const index = "0xfe";

    const precoded = ["0x11", "0x22", "0x33"];

    const output = abi.encode(["bytes[]"], [precoded]);

    const txBaseGas = await cbh.estimateGas.testWriteOutputsBaseGas(
      state,
      index,
      output
    );
    const txGas = await cbh.estimateGas.testWriteOutputs(state, index, output);
    console.log("writeOutputs gas cost: ", txGas.sub(txBaseGas).toString());
    const tx = await cbh.testWriteOutputs(state, index, output);

    expect(tx).to.deep.equal([precoded, output]);
  });
});
