import {expect} from './chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {EnsoShortcutsHelper} from '../typechain';

describe('Utils', async () => {
  describe('EnsoShortcutsHelper', () => {
    let EnsoShortcutsHelper: EnsoShortcutsHelper;

    before(async () => {
      EnsoShortcutsHelper = <EnsoShortcutsHelper>await ethers.getContract('EnsoShortcutsHelper');
    });

    it('getBalance', async () => {
      const {deployer: testAddress} = await getNamedAccounts();
      expect(await EnsoShortcutsHelper.getBalance(testAddress)).to.eq(await ethers.provider.getBalance(testAddress));
    });

    it('getBlocktimestamp', async () => {
      expect(await EnsoShortcutsHelper.getBlockTimestamp()).to.eq((await ethers.provider.getBlock('latest')).timestamp);
    });

    it('bytesToString', async () => {
      const testString = 'Hello World!';
      expect(await EnsoShortcutsHelper.bytesToString(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(testString)))).to.eq(
        testString
      );
    });

    it('bytes32ToAddress', async () => {
      const {deployer: testAddress} = await getNamedAccounts();
      expect(await EnsoShortcutsHelper.bytes32ToAddress(ethers.utils.hexZeroPad(testAddress, 32))).to.eq(testAddress);
    });

    it('bytes32ToUint256', async () => {
      const testNumber = ethers.constants.WeiPerEther.mul(50);
      expect(await EnsoShortcutsHelper.bytes32ToUint256(ethers.utils.hexZeroPad(testNumber.toHexString(), 32))).to.eq(
        testNumber
      );
    });
  });
});
