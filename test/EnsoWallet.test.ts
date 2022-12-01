import {expect} from './chai-setup';
import {ethers} from 'hardhat';
import {Contract, ContractTransaction} from 'ethers';
import {Planner, Contract as weiroll} from '@ensofinance/weiroll.js';
import {setup, ZERO_BYTES32} from './utils';

async function expectEventFromEnsoWallet(
  tx: ContractTransaction,
  emitterContract: Contract,
  eventName: string,
  ...eventArgs: string[]
) {
  await expect(tx)
    .to.emit(emitterContract, eventName)
    .withArgs(...eventArgs);
}

async function getImposter() {
  const {
    userWithEnsoWallet,
    userWithoutEnsoWallet: imposter,
    contracts: {
      core: {EnsoWallet},
    },
  } = await setup();

  imposter.EnsoWallet = EnsoWallet.attach(userWithEnsoWallet.EnsoWallet.address).connect(
    await ethers.getSigner(imposter.address)
  );

  return imposter;
}

describe('EnsoWallet', async () => {
  it('should execute on already deployed EnsoWallet', async () => {
    const {
      userWithEnsoWallet,
      contracts: {
        testing: {Events},
      },
    } = await setup();

    const planner = new Planner();

    const message = 'Hello World!';

    const weirolledEvents = weiroll.createContract(Events);
    planner.add(weirolledEvents.logString(message));
    const {commands, state} = planner.plan();
    const tx = await userWithEnsoWallet.EnsoWallet.executeShortcut(ZERO_BYTES32, commands, state);

    await expectEventFromEnsoWallet(tx, Events, 'LogString', message);
  });

  it('should not allow user to execute on other user EnsoWallet', async () => {
    const imposter = await getImposter();
    await expect(imposter.EnsoWallet.executeShortcut(ZERO_BYTES32, [], [])).to.be.revertedWith('NotPermitted');
  });

  it('should check valid signature (bytes32)', async function () {
    const {userWithEnsoWallet} = await setup();
    const signer = await ethers.getSigner(userWithEnsoWallet.address);
    const message = 'TEST';
    const signature = await signer.signMessage(message);
    const response = await userWithEnsoWallet.EnsoWallet['isValidSignature(bytes32,bytes)'](
      ethers.utils.hashMessage(message),
      signature
    );
    expect(response).to.equal('0x1626ba7e'); //Magic value
  });

  it('should fail to check invalid signature (bytes32)', async function () {
    const imposter = await getImposter();
    const signer = await ethers.getSigner(imposter.address);
    const message = 'FAIL';
    const signature = await signer.signMessage(message);
    const response = await imposter.EnsoWallet['isValidSignature(bytes32,bytes)'](
      ethers.utils.hashMessage(message),
      signature
    );
    expect(response).to.equal('0xffffffff'); //Invalid value
  });

  it('should fail to check invalid message (bytes32)', async function () {
    const imposter = await getImposter();
    const signer = await ethers.getSigner(imposter.address);
    const message = 'FAIL';
    const signature = await signer.signMessage(message);
    const response = await imposter.EnsoWallet['isValidSignature(bytes32,bytes)'](
      ethers.utils.hashMessage(''),
      signature
    ); //Bad message
    expect(response).to.equal('0xffffffff'); //Invalid value
  });

  it('should check valid signature (bytes)', async function () {
    const {userWithEnsoWallet} = await setup();
    const signer = await ethers.getSigner(userWithEnsoWallet.address);
    const message = 'TEST';
    const signature = await signer.signMessage(message);
    const response = await userWithEnsoWallet.EnsoWallet['isValidSignature(bytes,bytes)'](
      ethers.utils.toUtf8Bytes(message),
      signature
    );
    expect(response).to.equal('0x20c13b0b'); //Magic value
  });

  it('should fail to check invalid signature (bytes)', async function () {
    const imposter = await getImposter();
    const signer = await ethers.getSigner(imposter.address);
    const message = 'FAIL';
    const signature = await signer.signMessage(message);
    const response = await imposter.EnsoWallet['isValidSignature(bytes,bytes)'](
      ethers.utils.toUtf8Bytes(message),
      signature
    );
    expect(response).to.equal('0xffffffff'); //Invalid value
  });

  it('should fail to check invalid message (bytes)', async function () {
    const imposter = await getImposter();
    const signer = await ethers.getSigner(imposter.address);
    const message = 'FAIL';
    const signature = await signer.signMessage(message);
    const response = await imposter.EnsoWallet['isValidSignature(bytes,bytes)']('0x', signature); //Bad message
    expect(response).to.equal('0xffffffff'); //Invalid value
  });
});
