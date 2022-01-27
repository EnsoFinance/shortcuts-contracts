const { expect } = require("chai");
const { ethers } = require("hardhat");
const weiroll = require("@weiroll/weiroll.js");
const { addSyntheticLeadingComment, factory } = require("typescript");
const { getAddress } = require("ethers/lib/utils");

describe("ERC20", function () {

    let Factory, factory, salt;

    before(async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        Factory = await ethers.getContractFactory("PortalFactory");
        factory = await Factory.deploy(ethers.constants.AddressZero);
        salt = 55555;
    });
    it('should get gas costs', async () => {
        let bytecode = await factory.getBytecode(
            [],
            []
        )
        let addr = await factory.getAddress(bytecode, salt)
        let tx = await factory.deploy(bytecode, salt)
        let eventFilter = factory.filters.Deployed()
        let events = await factory.queryFilter(eventFilter)


        console.log(events)
        console.log('addr', addr)
    });
})