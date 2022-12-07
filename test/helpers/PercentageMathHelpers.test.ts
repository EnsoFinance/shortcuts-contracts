import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {PercentageMathHelpers} from '../../typechain';
import {BigNumber} from 'ethers';

describe('EnsoHelpers', async () => {
  describe('PercentageMathHelpers', () => {
    let percentageMathHelpers: PercentageMathHelpers;
    const PERCENTAGE_FACTOR = BigNumber.from(1e4);
    const HALF_PERCENT = PERCENTAGE_FACTOR.div(ethers.constants.Two);
    const zero = ethers.constants.Zero;
    const one = ethers.constants.One;
    const two = ethers.constants.Two;

    before(async () => {
      percentageMathHelpers = <PercentageMathHelpers>await ethers.getContract('PercentageMathHelpers');
    });

    it('has VERSION', async () => {
      const currentVersion = 1n;
      expect(await percentageMathHelpers.VERSION()).to.eq(currentVersion);
    });

    it('percentMul', async () => {
      const value = BigNumber.from(10000);
      const percentage = BigNumber.from(300);

      const expected = value.mul(percentage).add(HALF_PERCENT).div(PERCENTAGE_FACTOR);

      expect(await percentageMathHelpers.percentMul(value, percentage)).to.eq(expected);
    });

    it('percentDiv', async () => {
      const value = BigNumber.from(10000);
      const percentage = BigNumber.from(300);

      const expected = value.mul(PERCENTAGE_FACTOR).add(percentage.div(two)).div(percentage);

      expect(await percentageMathHelpers.percentDiv(value, percentage)).to.eq(expected);
    });

    it('percentMul reverts on multiplication overflow', async () => {
      const higherValue = ethers.constants.MaxUint256;

      const higherValueProvidable = higherValue.sub(HALF_PERCENT).div(one).add(one);

      await expect(percentageMathHelpers.percentMul(higherValueProvidable, one)).to.revertedWith(
        'multiplication overflow'
      );
    });

    it('percentDiv reverts on 0 percentage', async () => {
      const higherValue = ethers.constants.MaxUint256;
      const zero = ethers.constants.Zero;

      await expect(percentageMathHelpers.percentDiv(higherValue, zero)).to.revertedWith('Division by 0');
    });

    it('percentDiv reverts on multiplication overflow', async () => {
      const higherValue = ethers.constants.MaxUint256;
      const one = ethers.constants.One;
      const two = ethers.constants.Two;

      const higherValueProvidable = higherValue.sub(one.div(two)).div(PERCENTAGE_FACTOR).add(one);

      await expect(percentageMathHelpers.percentDiv(higherValueProvidable, one)).to.revertedWith(
        'multiplication overflow'
      );
    });
  });
});
