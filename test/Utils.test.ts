import {expect} from './chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {EnsoShortcutsHelper} from '../typechain';
import {BigNumber, constants} from 'ethers';

describe('Utils', async () => {
  describe('EnsoShortcutsHelper', () => {
    let EnsoShortcutsHelper: EnsoShortcutsHelper;

    before(async () => {
      EnsoShortcutsHelper = <EnsoShortcutsHelper>await ethers.getContract('EnsoShortcutsHelper');
    });

    it('has VERSION', async () => {
      const currentVersion = 2n;
      expect(await EnsoShortcutsHelper.VERSION()).to.eq(currentVersion);
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

    it('uint256ToInt256 works for number in range of int256', async () => {
      const uint256InRangeOfInt256 = BigNumber.from(12345678);
      expect(await EnsoShortcutsHelper.uint256ToInt256(uint256InRangeOfInt256)).to.eq(uint256InRangeOfInt256);
    });

    it('uint256ToInt256 reverts for number out of range of int256', async () => {
      const uint256OutOfRangeOfInt256 = constants.MaxInt256.add(1);
      await expect(EnsoShortcutsHelper.uint256ToInt256(uint256OutOfRangeOfInt256)).to.revertedWith(
        'Value does not fit in an int256'
      );
    });

    it('int256ToUint256 works for positive number', async () => {
      const positiveInt256 = constants.MaxInt256;
      expect(await EnsoShortcutsHelper.int256ToUint256(positiveInt256)).to.eq(positiveInt256);
    });

    it('int256ToUint256 reverts for negative numbers', async () => {
      const negativeInt256 = constants.MinInt256;

      await expect(EnsoShortcutsHelper.int256ToUint256(negativeInt256)).to.revertedWith('Value must be positive');
    });

    it('max', async () => {
      const higherValue = ethers.constants.MaxUint256;
      const lowerValue = ethers.constants.One;

      expect(await EnsoShortcutsHelper.max(higherValue, lowerValue)).to.eq(higherValue);
    });

    it('min', async () => {
      const higherValue = ethers.constants.MaxUint256;
      const lowerValue = ethers.constants.One;

      expect(await EnsoShortcutsHelper.min(higherValue, lowerValue)).to.eq(lowerValue);
    });

    it('average', async () => {
      const one = ethers.constants.One;
      const two = ethers.constants.Two;
      const expected = one;

      expect(await EnsoShortcutsHelper.average(one, two)).to.eq(expected);
    });

    it('average', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.Two;
      const expected = ethers.constants.Two;

      expect(await EnsoShortcutsHelper.average(a, b)).to.eq(expected);
    });

    it('add', async () => {
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a.add(b);

      expect(await EnsoShortcutsHelper.add(a, b)).to.eq(expected);
    });

    it('sub', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.sub(b);

      expect(await EnsoShortcutsHelper.sub(a, b)).to.eq(expected);
    });

    it('div', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.div(b);

      expect(await EnsoShortcutsHelper.div(a, b)).to.eq(expected);
    });

    it('mod without remainder', async () => {
      const a = ethers.constants.Two.mul(3);
      const b = ethers.constants.Two;
      const expected = a.mod(b);

      expect(await EnsoShortcutsHelper.mod(a, b)).to.eq(expected);
    });

    it('mod with remainder', async () => {
      const a = ethers.constants.Two.mul(4);
      const b = ethers.constants.Two.add(1);
      const expected = a.mod(b);

      expect(await EnsoShortcutsHelper.mod(a, b)).to.eq(expected);
    });
  });
});
