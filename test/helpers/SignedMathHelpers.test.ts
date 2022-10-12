import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {SignedMathHelpers} from '../../typechain';
import {BigNumber} from 'ethers';

describe('EnsoHelpers', async () => {
  describe('SignedMathHelpers', () => {
    let signedMathHelpers: SignedMathHelpers;

    before(async () => {
      signedMathHelpers = <SignedMathHelpers>await ethers.getContract('SignedMathHelpers');
    });

    it('has VERSION', async () => {
      const currentVersion = 1n;
      expect(await signedMathHelpers.VERSION()).to.eq(currentVersion);
    });
    it('max', async () => {
      const higherValue = ethers.constants.MaxInt256;
      const lowerValue = ethers.constants.One;

      expect(await signedMathHelpers.max(higherValue, lowerValue)).to.eq(higherValue);
    });

    it('min', async () => {
      const higherValue = ethers.constants.MaxInt256;
      const lowerValue = ethers.constants.MinInt256;

      expect(await signedMathHelpers.min(higherValue, lowerValue)).to.eq(lowerValue);
    });

    it('average', async () => {
      const a = ethers.constants.One;
      const b = BigNumber.from(3);
      const expected = ethers.constants.Two;

      expect(await signedMathHelpers.average(a, b)).to.eq(expected);
    });

    it('average rounding down', async () => {
      const one = ethers.constants.One;
      const two = ethers.constants.Two;
      const expected = one;

      expect(await signedMathHelpers.average(one, two)).to.eq(expected);
    });

    it('average of min and max equals 0', async () => {
      const one = ethers.constants.MaxInt256;
      const two = ethers.constants.MinInt256;
      const expected = ethers.constants.Zero;

      expect(await signedMathHelpers.average(one, two)).to.eq(expected);
    });

    it('add', async () => {
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a.add(b);

      expect(await signedMathHelpers.add(a, b)).to.eq(expected);
    });

    it('add reverts on overflow', async () => {
      const a = ethers.constants.One;
      const b = ethers.constants.MaxInt256;

      await expect(signedMathHelpers.add(a, b)).to.be.reverted;
    });

    it('sub', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.sub(b);

      expect(await signedMathHelpers.sub(a, b)).to.eq(expected);
    });

    it('sub reverts on underflow', async () => {
      const a = ethers.constants.MinInt256;
      const b = ethers.constants.One;

      await expect(signedMathHelpers.sub(a, b)).to.be.reverted;
    });

    it('div', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.div(b);

      expect(await signedMathHelpers.div(a, b)).to.eq(expected);
    });

    it('div reverts on 0', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.Zero;

      await expect(signedMathHelpers.div(a, b)).to.be.reverted;
    });

    it('should add under true condition', async () => {
      const condition = true;
      const method = signedMathHelpers.interface.getSighash('add');
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a.add(b);

      expect(await signedMathHelpers.conditional(condition, method, a, b)).to.eq(expected);
    });

    it('should not add under false condition', async () => {
      const condition = false;
      const method = signedMathHelpers.interface.getSighash('add');
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a;

      expect(await signedMathHelpers.conditional(condition, method, a, b)).to.eq(expected);
    });
  });
});
