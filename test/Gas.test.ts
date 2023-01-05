import {expect} from './chai-setup';
import {ethers} from 'hardhat';
import {setup, ZERO_BYTES32} from './utils';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';

const num = 5;

describe('Gas Test', async () => {
    it('transfers without weiroll', async () => {
        const accounts = await ethers.getSigners();

        const MockERC20 = await ethers.getContractFactory('MockERC20');
        const mockERC20 = await MockERC20.deploy('Test', 'TEST');
        const balance = await mockERC20.balanceOf(accounts[0].address);
        
        const amount = balance.div(num);
        
        let gasUsed = ethers.BigNumber.from(0);
        for (let i = 0; i < num; i++) {
            const tx = await mockERC20.transfer(accounts[1].address, amount);
            const receipt = await tx.wait()
            gasUsed = gasUsed.add(receipt.gasUsed)
        }
        console.log('Gas used: ', gasUsed.toString())
    });

    it('transfers with weiroll', async () => {
        const {userWithEnsoWallet: user} = await setup();
        const accounts = await ethers.getSigners();

        const MockERC20 = await ethers.getContractFactory('MockERC20');
        const mockERC20 = await MockERC20.deploy('Test', 'TEST');
        const balance = await mockERC20.balanceOf(accounts[0].address);
        await mockERC20.transfer(user.EnsoWallet.address, balance);

        const amount = balance.div(num);
        
        const weirolledERC20 = weiroll.createContract(mockERC20);
        const planner = new Planner();
        for (let i = 0; i < num; i++) {
            planner.add(weirolledERC20.transfer(accounts[1].address, amount));
        }
        const {commands, state} = planner.plan();
        const tx = await user.EnsoWallet.executeShortcut(ZERO_BYTES32, commands, state);
        const receipt = await tx.wait()
        console.log('Gas used: ', receipt.gasUsed.toString())
    });
});