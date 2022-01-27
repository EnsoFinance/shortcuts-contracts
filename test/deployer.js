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

    let Factory, factory, Portal, salt, events, vm, math, strings, stateTest, payable, vmLibrary, eventsContract, erc20, addr1, owner;

    before(async () => {
        [owner, addr1] = await ethers.getSigners();
        erc20 = await deployLibrary("LibERC20");

        tokenContract = await (await ethers.getContractFactory("ExecutorToken")).deploy(supply);

        eventsContract = await (await ethers.getContractFactory("Events")).deploy();
        events = weiroll.Contract.createLibrary(eventsContract);
    
        const Payable = await ethers.getContractFactory("Payable");
        payable = weiroll.Contract.createContract(await Payable.deploy());
    
        const VM = await ethers.getContractFactory("VM");
        vm = await VM.deploy();

        Factory = await ethers.getContractFactory("PortalFactory");
        factory = await Factory.deploy(vm.address);

        Portal = await ethers.getContractFactory("Portal");
    });
    it('should get gas costs', async () => {
        const planner = new weiroll.Planner();

        let token = tokenContract.address;
        let sender = owner.address;
        let to = addr1.address;

        planner.add(erc20.transferFrom(token, sender, to, amount));
        const {commands, state} = planner.plan();

        let bytecode = await factory.getBytecode()
        let portalAddr = await factory.getAddress(bytecode)
        await tokenContract.approve(portalAddr, amount.mul(3))

        console.log('approval', await tokenContract.allowance(owner.address, portalAddr))
        let tx = await factory.deploy(commands, state)
        portal = await Portal.attach(portalAddr);
          
        // console.log('factory', factory.address)
        // console.log('owner', owner.address)
        // console.log('vm', vm.address)
        // console.log('factory vm', await factory.vm())
        console.log('balance', await tokenContract.balanceOf(to))
        console.log('approval', await tokenContract.allowance(owner.address, portalAddr))

        // why is it 0 again? probably revert on execution? should we try simple math test?
    });
})