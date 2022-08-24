import {expect} from './chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {Utils, Balance} from '../typechain';
import {BigNumber, Contract} from 'ethers';

describe('Utils', function () {
  let contracts: {[name: string]: Contract};
  let deployer: string;

  before(async () => {
    ({deployer} = await getNamedAccounts());

    contracts = {
      Utils: <Utils>await ethers.getContract('Utils'),
      Balance: <Balance>await ethers.getContract('Balance'),
    };
  });

  it('should return balance', async () => {
    const encodedFunctionCall = contracts.Balance.interface.encodeFunctionData('getBalance', [deployer]);

    const result = await contracts.Utils.call('Balance', encodedFunctionCall);
    const balance = contracts.Balance.interface.decodeFunctionResult('getBalance', result);

    expect(BigNumber.from(balance.toString())).to.be.gt(0);
  });

  it('should fail for non existent util', async () => {
    const encodedFunctionCall = contracts.Balance.interface.encodeFunctionData('getBalance', [deployer]);
    const wrongUtil = 'Lala';

    await expect(contracts.Utils.call(wrongUtil, encodedFunctionCall)).to.be.revertedWith(
      `enso: util \\"${wrongUtil}\\" does not exist`
    );
  });
});
