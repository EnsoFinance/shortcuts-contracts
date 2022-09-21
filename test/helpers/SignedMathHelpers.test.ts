import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {SignedMathHelpers} from '../../typechain';

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
      const higherValue = ethers.constants.MaxUint256;
      const lowerValue = ethers.constants.One;

      expect(await signedMathHelpers.max(higherValue, lowerValue)).to.eq(higherValue);
    });

    it('min', async () => {
      const higherValue = ethers.constants.MaxUint256;
      const lowerValue = ethers.constants.One;

      expect(await signedMathHelpers.min(higherValue, lowerValue)).to.eq(lowerValue);
    });

    it('average', async () => {
      const one = ethers.constants.One;
      const two = ethers.constants.Two;
      const expected = one;

      expect(await signedMathHelpers.average(one, two)).to.eq(expected);
    });

    it('average', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.Two;
      const expected = ethers.constants.Two;

      expect(await signedMathHelpers.average(a, b)).to.eq(expected);
    });

    it('add', async () => {
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a.add(b);

      expect(await signedMathHelpers.add(a, b)).to.eq(expected);
    });

    it('sub', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.sub(b);

      expect(await signedMathHelpers.sub(a, b)).to.eq(expected);
    });

    it('div', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.div(b);

      expect(await signedMathHelpers.div(a, b)).to.eq(expected);
    });

    it('mod without remainder', async () => {
      const a = ethers.constants.Two.mul(3);
      const b = ethers.constants.Two;
      const expected = a.mod(b);

      expect(await signedMathHelpers.mod(a, b)).to.eq(expected);
    });

    it('mod with remainder', async () => {
      const a = ethers.constants.Two.mul(4);
      const b = ethers.constants.Two.add(1);
      const expected = a.mod(b);

      expect(await signedMathHelpers.mod(a, b)).to.eq(expected);
    });
  });
});
