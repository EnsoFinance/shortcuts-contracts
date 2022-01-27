const { expect } = require("chai");
const { ethers } = require("hardhat");
const weiroll = require("@weiroll/weiroll.js");
const { addSyntheticLeadingComment, factory } = require("typescript");
const { getAddress } = require("ethers/lib/utils");

async function deployLibrary(name) {
    const factory = await ethers.getContractFactory(name);
    const contract = await factory.deploy();
    return weiroll.Contract.createLibrary(contract);
}  

describe("ERC20", function () {
    let supply = ethers.BigNumber.from("100000000000000000000");
    let amount = supply.div(10);

    let Factory, factory, salt, events, vm, math, strings, stateTest, payable, vmLibrary, eventsContract, erc20, addr1, owner;

    before(async () => {
        [owner, addr1] = await ethers.getSigners();
        erc20 = await deployLibrary("LibERC20");
        tokenContract = await (await ethers.getContractFactory("ExecutorToken")).deploy(supply);

        eventsContract = await (await ethers.getContractFactory("Events")).deploy();
        events = weiroll.Contract.createLibrary(eventsContract);
    
        const StateTest = await ethers.getContractFactory("StateTest");
        stateTest = await StateTest.deploy();
    
        const Payable = await ethers.getContractFactory("Payable");
        payable = weiroll.Contract.createContract(await Payable.deploy());
    
        const VMLibrary = await ethers.getContractFactory("VM");
        vmLibrary = await VMLibrary.deploy();
    
        const VM = await ethers.getContractFactory("TestableVM");
        vm = await VM.deploy(vmLibrary.address);

        Factory = await ethers.getContractFactory("PortalFactory");
        factory = await Factory.deploy(vm.address);
        salt = 55555;

    });
    it('should get gas costs', async () => {
        const planner = new weiroll.Planner();
        let token = tokenContract.address;
        let to = addr1.address;

        planner.add(erc20.transfer(token, to, amount));
        const {commands, state} = planner.plan();
        let bytecode = await factory.getBytecode()

        let portal = await factory.getAddress(bytecode)
        await tokenContract.approve(portal, amount.mul(3))

        let tx = await factory.deploy(commands, state)
        let eventFilter = factory.filters.Deployed()
        let events = await factory.queryFilter(eventFilter)
        console.log('portal', portal)
        console.log('events', events)
        console.log('balance', await tokenContract.balanceOf(to))
  
        // why is it 0 again? probably revert on execution? should we try simple math test?
    });
})