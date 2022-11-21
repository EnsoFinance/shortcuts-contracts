import {expect} from './chai-setup';
import {ethers} from 'hardhat';
import {Contract, ContractTransaction, BigNumber} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {getMainnetSdk} from '@dethcrypto/eth-sdk-client';
import {AllowanceTransfer} from '@uniswap/permit2-sdk';
import {setup} from './utils';

/*
async function preparePermit(
	token: Contract,
	signer: SignerWithAddress,
	spender: string,
	value: BigNumber,
	deadline: BigNumber
) {
	const [name, nonce, version] = await Promise.all([
		token.name(),
		token.nonces(signer.address),
		token.version()
	])
	const typedData = {
		types: {
			EIP712Domain: [
				{ name: 'name', type: 'string' },
				{ name: 'version', type: 'string' },
				{ name: 'chainId', type: 'uint256' },
				{ name: 'verifyingContract', type: 'address' },
			],
			Permit: [
				{ name: 'owner', type: 'address' },
				{ name: 'spender', type: 'address' },
				{ name: 'value', type: 'uint256' },
				{ name: 'nonce', type: 'uint256' },
				{ name: 'deadline', type: 'uint256' },
			],
		},
		primaryType: 'Permit',
		domain: {
			name: name,
			version: version,
			chainId: '1',
			verifyingContract: token.address,
		},
		message: {
			owner: signer.address,
			spender: spender,
			value: value.toString(),
			nonce: nonce.toString(),
			deadline: deadline.toString(),
		},
	}

	if (signer.provider === undefined) return Error('Signer isnt connected to the network')
	return ethers.utils.splitSignature(await ethers.provider.send('eth_signTypedData_v4', [signer.address, typedData]))
}
*/

describe('Permit2', async () => {
  it('should use weth via permit2', async () => {
    const {
      userWithoutEnsoWallet: user,
      contracts: {
        core: {EnsoShortcuts},
      },
    } = await setup();
    const signer = await ethers.getSigner(user.address);
    const sdk = getMainnetSdk(signer);

    const amount = ethers.utils.parseUnits('10', '18')
    const deadline = '0'

    const permitData = AllowanceTransfer.getPermitData(
        {
          details: {
            token: sdk.WETH.address,
            amount: amount,
            expiration: deadline,
            nonce: '0',
          },
          spender: EnsoShortcuts.address,
          sigDeadline: deadline,
        },
        sdk.uniswap.permit2.address,
        1
    )

    console.log("permitdata: ", permitData)
    const { domain, types, values } = permitData
    const signature = await signer._signTypedData(domain, types, values)

    console.log("signature: ", signature)

    const { v, r, s } = ethers.utils.splitSignature(signature)

    // Wrap ETH
    await sdk.WETH.deposit({ value: amount })
    await sdk.WETH.approve(sdk.uniswap.permit2.address, ethers.constants.MaxUint256)

    const weirolledWETH = weiroll.Contract.createContract(sdk.uniswap.WETH);
    const weirolledUniswap = weiroll.Contract.createContract(sdk.uniswap.routerV3);

    const planner = new Planner();
    planner.add(weirolledWETH.approve(sdk.uniswap.routerV3.address, amount));
    planner.add(weirolledUniswap.exactInputSingle({
        tokenIn: sdk.weth.address,
        tokenOut: sdk.dai.address,
        fee: 3000,
        recipient: user.address,
        deadline: ethers.constants.MaxUint256, //unsafe, no deadline
        amountIn: amount,
        amountOutMinimum: 0, //unsafe, no minimum
        sqrtPriceLimitX96: 0
    }));
    const {commands, state} = planner.plan();

    const tx = await EnsoShortcuts.permit2AndExecuteShortcut(
      sdk.WETH.address,
      amount,
      deadline,
      v,
      r,
      s,
      commands,
      state
    );

    /*
    await expect(tx).to.emit(user.EnsoWalletFactory, 'Deployed').withArgs(EnsoWalletAddress, '');

    await expectEventFromEnsoWallet(tx, Events, 'LogUint', number.toString());
    await expectEventFromEnsoWallet(tx, Events, 'LogString', message);
    */
    expect(await sdk.dai.balanceOf(user.address)).to.be.gt(0)
  });
});
