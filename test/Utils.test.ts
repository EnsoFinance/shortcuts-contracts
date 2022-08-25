import {expect} from './chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {BalanceV1} from '../typechain';
import {Contract} from 'ethers';

describe('Utils', function () {
  let utils: {[name: string]: Contract};
  let deployer: string;

  before(async () => {
    ({deployer} = await getNamedAccounts());

    utils = {
      BalanceV1: <BalanceV1>await ethers.getContract('BalanceV1'),
    };
  });

  describe('BalanceV1', () => {
    it('getBalance', async () => {
      expect(await utils.BalanceV1.getBalance(deployer)).to.eq(await ethers.provider.getBalance(deployer));
    });
  });
});
