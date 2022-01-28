const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const weiroll = require("@weiroll/weiroll.js");
const { addSyntheticLeadingComment, factory } = require("typescript");
const { getAddress } = require("ethers/lib/utils");

async function deployLibrary(name) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy();
  return weiroll.Contract.createLibrary(contract);
}

describe("Portal", function () {
  let supply = ethers.BigNumber.from("100000000000000000000");
  let amount = supply.div(10);

  let Factory,
    factory,
    Portal,
    events,
    eventsContract,
    erc20,
    addr1,
    owner;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    erc20 = await deployLibrary("LibERC20");

    tokenContract = await (
      await ethers.getContractFactory("ExecutorToken")
    ).deploy(supply);

    eventsContract = await (await ethers.getContractFactory("Events")).deploy();
    events = weiroll.Contract.createLibrary(eventsContract);

    Factory = await ethers.getContractFactory("PortalFactory");
    factory = await Factory.deploy();

    Portal = await ethers.getContractFactory("Portal");
  });

  describe("Factory", async () => {
    it("should predict address before deploy", async () => {
      const predict = await factory.getAddress();

      let ABI = [
        "function initialize(address _owner, bytes32[] calldata commands, bytes[] memory state)",
      ];
      let iface = new ethers.utils.Interface(ABI);
      let init = iface.encodeFunctionData("initialize", [
        owner.address,
        [],
        [],
      ]);

      const tx = await factory.deploy(init);
      await expect(tx).to.emit(factory, "Deployed").withArgs(predict);
    });

    it("should execute on already deployed portal", async () => {
      const address = await factory.getAddress();
      const portal = await Portal.attach(address);
      const message = "Hello World!";

      const planner = new weiroll.Planner();
      planner.add(events.logString(message));
      const { commands, state } = planner.plan();

      const tx = await portal.execute(commands, state);
      await expect(tx)
        .to.emit(eventsContract.attach(address), "LogString")
        .withArgs(message);
    });
  });

  it("should access tokens that were approved before deploy", async () => {
    const planner = new weiroll.Planner();

    let token = tokenContract.address;
    let sender = owner.address;
    let to = addr1.address;

    planner.add(erc20.transferFrom(token, sender, to, amount));
    const { commands, state } = planner.plan();

    let predict = await factory.getAddress();
    console.log("predict", predict);

    let ABI = [
      "function initialize(address _owner, bytes32[] calldata commands, bytes[] memory state)",
    ];
    let iface = new ethers.utils.Interface(ABI);
    let init = iface.encodeFunctionData("initialize", [
      owner.address,
      commands,
      state,
    ]);

    // approve
    await tokenContract.approve(predict, amount);

    const tx = await factory.deploy(init);
    await expect(tx)
      .to.emit(tokenContract, "Transfer")
      .withArgs(owner, to, amount);

    let balance = await tokenContract.balanceOf(to);
    expect(balance).to.be.eq(amount);
  });
});
