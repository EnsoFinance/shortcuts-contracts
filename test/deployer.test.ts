import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { Signer } from "ethers";
import * as weiroll from "@weiroll/weiroll.js";

async function deployLibrary(name: string) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy();
  return weiroll.Contract.createLibrary(contract);
}

describe("Portal", function () {
  const supply = ethers.BigNumber.from("100000000000000000000");

  let Factory: ContractFactory,
    factory: Contract,
    Portal: ContractFactory,
    portal: Contract,
    events: weiroll.Contract,
    eventsContract: Contract,
    erc20: weiroll.Contract,
    addr1: Signer,
    owner: Signer;

  before(async () => {
    [owner, addr1] = await ethers.getSigners();
    erc20 = await deployLibrary("LibERC20");

    eventsContract = await (await ethers.getContractFactory("Events")).deploy();
    events = weiroll.Contract.createLibrary(eventsContract);

    const VMLibrary = await ethers.getContractFactory("VM");
    const vmLibrary = await VMLibrary.deploy();

    console.log("vmLibrary", vmLibrary.address);

    Factory = await ethers.getContractFactory("PortalFactory");
    factory = await Factory.deploy();

    Portal = await ethers.getContractFactory("Portal");
    portal = await Portal.deploy();
    console.log("portal", portal.address);
  });

  describe("Factory", async () => {
    it("should predict address before deploy", async () => {
      const predict = await factory.getAddress();

      const ABI = [
        "function initialize(address _owner, bytes32[] calldata commands, bytes[] memory state)",
      ];
      const iface = new ethers.utils.Interface(ABI);
      const init = iface.encodeFunctionData("initialize", [
        await owner.getAddress(),
        [],
        [],
      ]);
      const tx = await factory.deploy(init);
      await expect(tx).to.emit(factory, "Deployed").withArgs(predict);
    });

    it.skip("should execute on already deployed portal", async () => {
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

  // it("should access tokens that were approved before deploy", async () => {
  //   const planner = new weiroll.Planner();

  //   let token = tokenContract.address;
  //   let sender = owner.address;
  //   let to = addr1.address;

  //   planner.add(erc20.transferFrom(token, sender, to, amount));
  //   const { commands, state } = planner.plan();

  //   let predict = await factory.getAddress();
  //   console.log("predict", predict);

  //   let ABI = [
  //     "function initialize(address _owner, bytes32[] calldata commands, bytes[] memory state)",
  //   ];
  //   let iface = new ethers.utils.Interface(ABI);
  //   let init = iface.encodeFunctionData("initialize", [
  //     owner.address,
  //     commands,
  //     state,
  //   ]);

  //   // approve
  //   await tokenContract.approve(predict, amount);

  //   const tx = await factory.deploy(init);
  //   await expect(tx)
  //     .to.emit(tokenContract, "Transfer")
  //     .withArgs(owner, to, amount);

  //   let balance = await tokenContract.balanceOf(to);
  //   expect(balance).to.be.eq(amount);
  // });
});
