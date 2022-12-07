import {expect} from '../chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {EnsoShortcutsHelpers} from '../../typechain';
import {BigNumber, constants} from 'ethers';

describe('EnsoHelpers', async () => {
  describe('EnsoShortcutsHelpers', () => {
    let ensoShortcutsHelpers: EnsoShortcutsHelpers;

    before(async () => {
      ensoShortcutsHelpers = <EnsoShortcutsHelpers>await ethers.getContract('EnsoShortcutsHelpers');
    });

    it('has VERSION', async () => {
      const currentVersion = 2n;
      expect(await ensoShortcutsHelpers.VERSION()).to.eq(currentVersion);
    });

    it('getBalance', async () => {
      const {deployer: testAddress} = await getNamedAccounts();
      expect(await ensoShortcutsHelpers.getBalance(testAddress)).to.eq(await ethers.provider.getBalance(testAddress));
    });

    it('getBlockTimestamp', async () => {
      expect(await ensoShortcutsHelpers.getBlockTimestamp()).to.eq(
        (await ethers.provider.getBlock('latest')).timestamp
      );
    });

    it('bytesToString', async () => {
      const testString = 'Hello World!';
      expect(
        await ensoShortcutsHelpers.bytesToString(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(testString)))
      ).to.eq(testString);
    });

    it('bytes32ToAddress', async () => {
      const {deployer: testAddress} = await getNamedAccounts();
      expect(await ensoShortcutsHelpers.bytes32ToAddress(ethers.utils.hexZeroPad(testAddress, 32))).to.eq(testAddress);
    });

    it('bytesToUint256', async () => {
      const testNumber = ethers.constants.WeiPerEther.mul(50);
      expect(await ensoShortcutsHelpers.bytesToUint256(ethers.utils.hexZeroPad(testNumber.toHexString(), 32))).to.eq(
        testNumber
      );
    });

    it('bytesToBytes32', async () => {
      const randomBytes64 = ethers.utils.randomBytes(64);
      const testBytes = ethers.utils.hexlify(randomBytes64);

      expect(await ensoShortcutsHelpers.bytesToBytes32(randomBytes64)).to.eq(
        ethers.utils.hexDataSlice(testBytes, 0, 32)
      );
    });

    it('bytes32ToUint256', async () => {
      const testNumber = ethers.constants.WeiPerEther.mul(50);
      expect(await ensoShortcutsHelpers.bytes32ToUint256(ethers.utils.hexZeroPad(testNumber.toHexString(), 32))).to.eq(
        testNumber
      );
    });

    it('uint256ToInt256 works for number in range of int256', async () => {
      const uint256InRangeOfInt256 = BigNumber.from(12345678);
      expect(await ensoShortcutsHelpers.uint256ToInt256(uint256InRangeOfInt256)).to.eq(uint256InRangeOfInt256);
    });

    it('uint256ToInt256 reverts for number out of range of int256', async () => {
      const uint256OutOfRangeOfInt256 = constants.MaxInt256.add(1);
      await expect(ensoShortcutsHelpers.uint256ToInt256(uint256OutOfRangeOfInt256)).to.revertedWith(
        'Value does not fit in an int256'
      );
    });

    it('int256ToUint256 works for positive number', async () => {
      const positiveInt256 = constants.MaxInt256;
      expect(await ensoShortcutsHelpers.int256ToUint256(positiveInt256)).to.eq(positiveInt256);
    });

    it('int256ToUint256 reverts for negative numbers', async () => {
      const negativeInt256 = constants.MinInt256;

      await expect(ensoShortcutsHelpers.int256ToUint256(negativeInt256)).to.revertedWith('Value must be positive');
    });
  });
});
