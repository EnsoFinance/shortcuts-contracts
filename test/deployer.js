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
        let tx = await factory.deploy(commands, state)
        // user has recently deployed allocated
        assert.equal(await factory.user(owner.address), portalAddr);
        // allowance updated
        let allowance = await tokenContract.allowance(owner.address, portalAddr)
        allowance.eq(amount.mul(2))
        // balance updated
        let balance = await tokenContract.balanceOf(to);
        balance.eq(amount)

        // test again same call, and verify no new is created
        assert.equal(await factory.getAddress(bytecode), portalAddr)
        // revert when deploy already called
        await expect(factory.deploy(commands, state))
        .to.be.revertedWith('PortalFactory#deploy: already deployed')
        // do new call, and verify balance
        let portal = await Portal.attach(portalAddr);
        await portal.execute(commands, state);
        // allowance updated
        allowance = await tokenContract.allowance(owner.address, portalAddr)
        allowance.eq(amount)
        // balance updated
        balance = await tokenContract.balanceOf(to);
        balance.eq(amount.mul(2))
        // revert if not calling from owner
        // await expect(portal.connect(addr1).execute(commands, state))
        // .to.be.revertedWith('Portal#onlyOwner: not owner')
    });
})