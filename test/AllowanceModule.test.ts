import {expect} from './chai-setup';
import {ethers} from 'hardhat';
import { Contract } from "ethers"
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';

import {setup} from './utils';

const { AddressZero } = ethers.constants

const signMessage = async (signer: SignerWithAddress, hash: string) => {
    // Weird design by gnosis. They change 'v' from 28 -> 32 for this type of signature
    return (await signer.signMessage(ethers.utils.arrayify(hash))).replace(/1b$/, "1f").replace(/1c$/, "20")
}

describe('AllowanceModule delegate', function() {
    let accounts: SignerWithAddress[];
    let ensoWallet: Contract;
    let safeModule: Contract;

    beforeEach(async function() {
        accounts = await ethers.getSigners()
        const { userWithEnsoWallet: user } = await setup();
        ensoWallet = user.EnsoWallet;

        const AllowanceModule = await ethers.getContractFactory('AllowanceModule')
        safeModule = await AllowanceModule.deploy()
    })

    it('Execute allowance with delegate', async () => {
        const MockERC20 = await ethers.getContractFactory('MockERC20')
        const token = await MockERC20.deploy('Test', 'TEST')
        await token.transfer(ensoWallet.address, 1000) 

        await ensoWallet.setPermission(await ensoWallet.MODULE_ROLE(), safeModule.address, true);

        let addDelegateData = await safeModule.interface.encodeFunctionData('addDelegate', [accounts[4].address])
        await ensoWallet.execute(safeModule.address, 0, addDelegateData)

        let delegates = await safeModule.getDelegates(ensoWallet.address, 0, 10)
        expect(delegates.results.length).to.equal(1)
        expect(delegates.results[0]).to.equal(accounts[4].address)

        let setAllowanceData = await safeModule.interface.encodeFunctionData('setAllowance', [accounts[4].address, token.address, 100, 0, 0])
        await ensoWallet.execute(safeModule.address, 0, setAllowanceData)

        let tokens = await safeModule.getTokens(ensoWallet.address, accounts[4].address)
        expect(tokens.length).to.equal(1)
        expect(tokens[0]).to.equal(token.address)
        let tokenAllowance = await safeModule.getTokenAllowance(ensoWallet.address, accounts[4].address, token.address)
        expect(tokenAllowance[0]).to.equal(100)
        expect(tokenAllowance[1]).to.equal(0)
        expect(tokenAllowance[2]).to.equal(0)
        // Reset time should be set to current on first init
        expect(tokenAllowance[3]).to.not.equal(0)
        expect(tokenAllowance[4]).to.equal(1)
        let unknownAllowance = await safeModule.getTokenAllowance(ensoWallet.address, accounts[3].address, token.address)
        expect(unknownAllowance[0]).to.equal(0)
        expect(unknownAllowance[1]).to.equal(0)
        expect(unknownAllowance[2]).to.equal(0)
        expect(unknownAllowance[3]).to.equal(0)
        expect(unknownAllowance[4]).to.equal(0)

        expect(await token.balanceOf(ensoWallet.address)).to.equal(1000)
        expect(await token.balanceOf(accounts[1].address)).to.equal(0)

        let nonce = tokenAllowance[4]
        let transferHash = await safeModule.generateTransferHash(
            ensoWallet.address, token.address, accounts[1].address, 60, AddressZero, 0, nonce
        )
        
        let signature = await signMessage(accounts[4], transferHash)

        await safeModule.executeAllowanceTransfer(
            ensoWallet.address, token.address, accounts[1].address, 60, AddressZero, 0, accounts[4].address, signature
        )

        expect(await token.balanceOf(ensoWallet.address)).to.equal(940)
        expect(await token.balanceOf(accounts[1].address)).to.equal(60)

        let tokenLimit = await safeModule.getTokenAllowance(ensoWallet.address, accounts[4].address, token.address)
        expect(tokenLimit[0]).to.equal(100)
        expect(tokenLimit[1]).to.equal(60)
        expect(tokenLimit[2]).to.equal(0)
        expect(tokenLimit[3] > 0).to.equal(true)
        expect(tokenLimit[4]).to.equal(2)

        let removeDelegateData = await safeModule.interface.encodeFunctionData('removeDelegate', [accounts[4].address, true])
        await ensoWallet.execute(safeModule.address, 0, removeDelegateData)
        let removedAllowance = await safeModule.getTokenAllowance(ensoWallet.address, accounts[4].address, token.address)
        expect(removedAllowance[0]).to.equal(0)
        expect(removedAllowance[1]).to.equal(0)
        expect(removedAllowance[2]).to.equal(0)
        expect(removedAllowance[3]).to.equal(0)
        expect(removedAllowance[4]).to.equal(2)
    })

    it('Execute multiple ether allowance with delegate', async () => {
        const startBalance = await ethers.provider.getBalance(accounts[1].address)

        await accounts[0].sendTransaction({to: ensoWallet.address, value: ethers.utils.parseEther('1.0')})
        expect(await ethers.provider.getBalance(ensoWallet.address)).to.equal(ethers.utils.parseEther('1.0'))

        await ensoWallet.setPermission(await ensoWallet.MODULE_ROLE(), safeModule.address, true);

        let addDelegateData = await safeModule.interface.encodeFunctionData('addDelegate', [accounts[4].address])
        await ensoWallet.execute(safeModule.address, 0, addDelegateData)

        let delegates = await safeModule.getDelegates(ensoWallet.address, 0, 10)
        expect(delegates.results.length).to.equal(1)
        expect(delegates.results[0]).to.equal(accounts[4].address)

        let setAllowanceData = await safeModule.interface.encodeFunctionData('setAllowance', [accounts[4].address, AddressZero, ethers.utils.parseEther('1.0'), 0, 0])
        await ensoWallet.execute(safeModule.address, 0, setAllowanceData)

        let tokens = await safeModule.getTokens(ensoWallet.address, accounts[4].address)
        expect(tokens.length).to.equal(1)
        expect(tokens[0]).to.equal(AddressZero)
        let tokenAllowance = await safeModule.getTokenAllowance(ensoWallet.address, accounts[4].address, AddressZero)
        expect(tokenAllowance[0]).to.equal(ethers.utils.parseEther('1.0'))
        expect(tokenAllowance[1]).to.equal(0)
        expect(tokenAllowance[2]).to.equal(0)
        // Reset time should be set to current on first init
        expect(tokenAllowance[3]).to.not.equal(0)
        expect(tokenAllowance[4]).to.equal(1)

        expect(await ethers.provider.getBalance(ensoWallet.address)).to.equal(ethers.utils.parseEther('1.0'))
        expect((await ethers.provider.getBalance(accounts[1].address)).sub(startBalance)).to.equal(0)

        let nonce = tokenAllowance[4]
        let transferHash = await safeModule.generateTransferHash(
            ensoWallet.address, AddressZero, accounts[1].address, ethers.utils.parseEther('0.001'), AddressZero, 0, nonce
        )
        let signature = signMessage(accounts[4], transferHash)

        await safeModule.executeAllowanceTransfer(
            ensoWallet.address, AddressZero, accounts[1].address, ethers.utils.parseEther('0.001'), AddressZero, 0, accounts[4].address, signature
        )

        expect(await ethers.provider.getBalance(ensoWallet.address)).to.equal(ethers.utils.parseEther('0.999'))
        expect((await ethers.provider.getBalance(accounts[1].address)).sub(startBalance)).to.equal(ethers.utils.parseEther('0.001'))

        tokenAllowance = await safeModule.getTokenAllowance(ensoWallet.address, accounts[4].address, AddressZero)
        expect(tokenAllowance[0]).to.equal(ethers.utils.parseEther('1.0'))
        expect(tokenAllowance[1]).to.equal(ethers.utils.parseEther('0.001'))
        expect(tokenAllowance[2]).to.equal(0)
        expect(tokenAllowance[3] > 0).to.equal(true)
        expect(tokenAllowance[4]).to.equal(2)

        nonce = tokenAllowance[4]
        transferHash = await safeModule.generateTransferHash(
            ensoWallet.address, AddressZero, accounts[1].address, ethers.utils.parseEther('0.001'), AddressZero, 0, nonce
        )
        signature = signMessage(accounts[4], transferHash)

        await safeModule.executeAllowanceTransfer(
            ensoWallet.address, AddressZero, accounts[1].address, ethers.utils.parseEther('0.001'), AddressZero, 0, accounts[4].address, signature
        )
        expect(await ethers.provider.getBalance(ensoWallet.address)).to.equal(ethers.utils.parseEther('0.998'))
        expect((await ethers.provider.getBalance(accounts[1].address)).sub(startBalance)).to.equal(ethers.utils.parseEther('0.002'))

        tokenAllowance = await safeModule.getTokenAllowance(ensoWallet.address, accounts[4].address, AddressZero)
        expect(tokenAllowance[0]).to.equal(ethers.utils.parseEther('1.0'))
        expect(tokenAllowance[1]).to.equal(ethers.utils.parseEther('0.002'))
        expect(tokenAllowance[2]).to.equal(0)
        expect(tokenAllowance[3] > 0).to.equal(true)
        expect(tokenAllowance[4]).to.equal(3)
    })
})