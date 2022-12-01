import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {MathHelpers} from '../../typechain';
import {BigNumber} from 'ethers';

describe('EnsoHelpers', async () => {
  describe('MathHelpers', () => {
    let mathHelpers: MathHelpers;

    before(async () => {
      mathHelpers = <MathHelpers>await ethers.getContract('MathHelpers');
    });

    it('has VERSION', async () => {
      const currentVersion = 1n;
      expect(await mathHelpers.VERSION()).to.eq(currentVersion);
    });

    it('max', async () => {
      const higherValue = ethers.constants.MaxUint256;
      const lowerValue = ethers.constants.One;

      expect(await mathHelpers.max(higherValue, lowerValue)).to.eq(higherValue);
    });

    it('min', async () => {
      const higherValue = ethers.constants.MaxUint256;
      const lowerValue = ethers.constants.One;

      expect(await mathHelpers.min(higherValue, lowerValue)).to.eq(lowerValue);
    });

    it('average', async () => {
      const one = ethers.constants.One;
      const two = ethers.constants.Two;
      const expected = one;

      expect(await mathHelpers.average(one, two)).to.eq(expected);
    });

    it('average', async () => {
      const a = ethers.constants.One;
      const b = BigNumber.from(3);
      const expected = ethers.constants.Two;

      expect(await mathHelpers.average(a, b)).to.eq(expected);
    });

    it('add', async () => {
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a.add(b);

      expect(await mathHelpers.add(a, b)).to.eq(expected);
    });

    it('add reverts on overflow', async () => {
      const a = ethers.constants.One;
      const b = ethers.constants.MaxUint256;

      await expect(mathHelpers.add(a, b)).to.be.reverted;
    });

    it('sub', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.sub(b);

      expect(await mathHelpers.sub(a, b)).to.eq(expected);
    });

    it('sub reverts on underflow', async () => {
      const a = ethers.constants.Zero;
      const b = ethers.constants.One;

      await expect(mathHelpers.sub(a, b)).to.be.reverted;
    });

    it('div', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.One;
      const expected = a.div(b);

      expect(await mathHelpers.div(a, b)).to.eq(expected);
    });

    it('div reverts on 0', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.Zero;

      await expect(mathHelpers.div(a, b)).to.be.reverted;
    });

    it('mod without remainder', async () => {
      const a = ethers.constants.Two.mul(3);
      const b = ethers.constants.Two;
      const expected = a.mod(b);

      expect(await mathHelpers.mod(a, b)).to.eq(expected);
    });

    it('mod with remainder', async () => {
      const a = ethers.constants.Two.mul(4);
      const b = ethers.constants.Two.add(1);
      const expected = a.mod(b);

      expect(await mathHelpers.mod(a, b)).to.eq(expected);
    });

    it('mod reverts on 0', async () => {
      const a = ethers.constants.Two;
      const b = ethers.constants.Zero;

      await expect(mathHelpers.mod(a, b)).to.be.reverted;
    });

    it('should add under true condition', async () => {
      const condition = true;
      const method = mathHelpers.interface.getSighash('add');
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a.add(b);

      expect(await mathHelpers.conditional(condition, method, a, b)).to.eq(expected);
    });

    it('should not add under false condition', async () => {
      const condition = false;
      const method = mathHelpers.interface.getSighash('add');
      const a = ethers.constants.One;
      const b = ethers.constants.Two;
      const expected = a;

      expect(await mathHelpers.conditional(condition, method, a, b)).to.eq(expected);
    });
  });
});
