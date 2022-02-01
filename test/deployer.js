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

  before(async () => {
    [owner, addr1] = await ethers.getSigners();
    erc20 = await deployLibrary("LibERC20");

    tokenContract = await (
      await ethers.getContractFactory("ExecutorToken")
    ).deploy(supply);

    eventsContract = await (await ethers.getContractFactory("Events")).deploy();
    events = weiroll.Contract.createLibrary(eventsContract);

    const VMLibrary = await ethers.getContractFactory("VM");
    const vmLibrary = await VMLibrary.deploy();

    console.log('vmLibrary', vmLibrary.address)

    Factory = await ethers.getContractFactory("PortalFactory");
    factory = await Factory.deploy();

    Portal = await ethers.getContractFactory("Portal");
    portal = await Portal.deploy()
    console.log('portal', portal.address)

    Recipe = await ethers.getContractFactory("Recipe");
    recipe = await Recipe.deploy()
    console.log('recipe', recipe.address)
  });

  describe("Factory", async () => {
    it('dirty full IT', async () => {
      const predict_portal = await factory.getPortal();
      let ABI_PORTAL = [
        "function initialize(address _caller, bytes32[] calldata commands, bytes[] memory state)",
      ];
      let iface_portal = new ethers.utils.Interface(ABI_PORTAL);
      let init_portal = iface_portal.encodeFunctionData("initialize", [
        owner.address,
        [],
        [],
      ]);

      const planner = new weiroll.Planner();
      // console.log(eventsContract.address)
      planner.add(events.logString("lfg degens"));
      const { commands, state } = planner.plan();
      console.log('commands', commands)

      let predict_recipe = await factory.getRecipe()
      let ABI_RECIPE = [
        "function initialize(address _caller, bytes32[] calldata _commands, uint256 _fee, string memory _name, string memory _symbol)",
      ]
      let iface_recipe = new ethers.utils.Interface(ABI_RECIPE);
      let init_recipe = iface_recipe.encodeFunctionData("initialize", [
        owner.address,
        commands,
        0,
        "name",
        "symbol"
      ]);
      const tx = await factory.deployRecipe(init_portal, init_recipe);
      recipe_depoyed = await Recipe.attach(predict_recipe);

      console.log(await recipe_depoyed.getLength())
      console.log(await recipe_depoyed.getCommands())
    });

    // it("should predict address before deploy", async () => {
  
    //   const predict = await factory.getAddress();

    //   let ABI = [
    //     "function initialize(address _owner, bytes32[] calldata commands, bytes[] memory state)",
    //   ];
    //   let iface = new ethers.utils.Interface(ABI);
    //   let init = iface.encodeFunctionData("initialize", [
    //     owner.address,
    //     [],
    //     [],
    //   ]);

    //   const tx = await factory.deploy(init);
    //   // await expect(tx).to.emit(factory, "Deployed").withArgs(predict);
    // });

    // it("should execute on already deployed portal", async () => {
    //   const address = await factory.getAddress();
    //   const portal = await Portal.attach(address);
    //   const message = "Hello World!";

    //   const planner = new weiroll.Planner();
    //   console.log(eventsContract.address)
    //   planner.add(events.logString(message));
    //   planner.add(events.logString('trial'));
    //   const { commands, state } = planner.plan();
    //   console.log('commands', commands)
    //   console.log('state', state)

    //   const tx = await portal.execute(commands, state);
    //   // console.log(tx)
    //   // await expect(tx)
    //   //   .to.emit(eventsContract.attach(address), "LogString")
    //   //   .withArgs(message);
    // });
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
