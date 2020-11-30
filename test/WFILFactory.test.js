// based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/presets/ERC20PresetMinterPauser.test.js

// test/WFILFactory.test.js

const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, constants, expectEvent, expectRevert, send, ether, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const WFIL = contract.fromArtifact('WFIL');
const WFILFactory = contract.fromArtifact('WFILFactory');

let wfil;
let factory;

describe('WFILFactory', function () {
const [ deployer, dao, owner, newOwner, merchant, merchant2, custodian, custodian2, minter, other ] = accounts;


const amount = ether('10');

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MERCHANT_ROLE = web3.utils.soliditySha3('MERCHANT_ROLE');
const CUSTODIAN_ROLE = web3.utils.soliditySha3('CUSTODIAN_ROLE');
const PAUSER_ROLE = web3.utils.soliditySha3('PAUSER_ROLE');

const ZERO = 0;
const nonce = '0';

const deposit = 't3q32q2hmq63tpgejlsuubkqjpfqhv75vu2ieg2jhyqhob7dikuftf4mjhobueuurnb77v67rnhr7diz6l2iaq';
const txId = 'bafkqadlgnfwc6mrpmfrwg33vnz2a'

  beforeEach(async function () {
    wfil = await WFIL.new(dao, { from: deployer });
    factory = await WFILFactory.new(wfil.address, owner, { from: deployer });
    await wfil.addMinter(factory.address, {from: dao});
    await factory.addCustodian(custodian, {from: owner});
    await factory.addMerchant(merchant, {from:owner});
  });

  describe('Setup', async function () {
    it('owner has the default admin role', async function () {
      expect(await factory.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.be.bignumber.equal('1');
      expect(await factory.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(owner);
    });

    it('owner has the pauser role', async function () {
      expect(await factory.getRoleMemberCount(PAUSER_ROLE)).to.be.bignumber.equal('1');
      expect(await factory.getRoleMember(PAUSER_ROLE, 0)).to.equal(owner);
    });

    it('pauser is the default admin', async function () {
      expect(await wfil.getRoleAdmin(PAUSER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
  });

  // Check Fallback function
  describe('fallback()', async function () {
    it('should revert when sending ether to contract address', async function () {
        await expectRevert.unspecified(send.ether(other, factory.address, 1));
    });
  });

  describe('setOwner()', function () {
    it('default admin can set a new owner', async function () {
      const receipt = await factory.setOwner(newOwner, { from: owner });
      expect(await factory.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(newOwner);
    });

    it('should emit the appropriate event when newOwner is set', async () => {
      const receipt = await factory.setOwner(newOwner, {from: owner});
      expectEvent(receipt, 'OwnerChanged', { previousOwner: owner , newOwner: newOwner });
      expectEvent(receipt, 'RoleGranted', { account: newOwner });
    });

    it("should revert when account is set to zero address", async () => {
      await expectRevert(factory.setOwner(ZERO_ADDRESS, {from:owner}), 'WFILFactory: new owner is the zero address');
    });

    it('other accounts cannot set a new owner', async function () {
      await expectRevert(factory.setOwner(newOwner, { from: other }),'WFILFactory: caller is not the default admin');
    });
  });

  describe('setCustodianDeposit()', function () {
    it('custodian can set custodian deposit address', async function () {
      const receipt = await factory.setCustodianDeposit(merchant, deposit, { from: custodian });
      expect(await factory.custodian(merchant)).to.equal(deposit);
    });

    it('should emit the appropriate event when new custodian deposit address is set', async () => {
      const receipt = await factory.setCustodianDeposit(merchant, deposit, {from: custodian});
      expectEvent(receipt, 'CustodianDepositSet', { merchant: merchant, custodian: custodian, deposit: deposit });
    });

    it("should revert when merchant is set to zero address", async () => {
      await expectRevert(factory.setCustodianDeposit(ZERO_ADDRESS, deposit, {from:custodian}), 'WFILFactory: invalid merchant address');
    });

    it('other accounts cannot set a new custodian deposit address', async function () {
      await expectRevert(factory.setCustodianDeposit(merchant, deposit, { from: other }),'WFILFactory: caller is not a custodian');
    });
  });

  describe('setMerchantDeposit()', function () {
    it('merchant can set merchant deposit address', async function () {
      const receipt = await factory.setMerchantDeposit(deposit, { from: merchant });
      expect(await factory.merchant(merchant)).to.equal(deposit);
    });

    it('should emit the appropriate event when new merchant deposit address is set', async () => {
      const receipt = await factory.setMerchantDeposit(deposit, {from: merchant});
      expectEvent(receipt, 'MerchantDepositSet', { merchant: merchant, deposit: deposit });
    });

    it('other accounts cannot set a new merchant deposit address', async function () {
      await expectRevert(factory.setMerchantDeposit(deposit, { from: other }),'WFILFactory: caller is not a merchant');
    });
  });

  describe('addMintRequest()', function () {
    beforeEach(async function () {
      await factory.setCustodianDeposit(merchant, deposit, { from: custodian });
      await time.advanceBlock();
    });

    it('merchant can add a mint request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const timestamp = await time.latest();
      const requestHash = logs[0].args.requestHash;
      const txId = '';
      const receipt = await factory.getMintRequest(nonce, {from: other});
      expect(receipt.requestNonce).to.be.bignumber.equal(nonce);
      expect(receipt.requester).to.equal(merchant);
      expect(receipt.amount).to.be.bignumber.equal(amount);
      expect(receipt.deposit).to.equal(deposit);
      expect(receipt.txId).to.equal("");
      expect(receipt.timestamp).to.be.bignumber.equal(timestamp);
      expect(receipt.status).to.equal('pending');
      expect(receipt.requestHash).to.equal(requestHash);
    });

    it('should emit the appropriate event when a merchant add a mint request', async () => {
      const receipt = await factory.addMintRequest(amount, deposit, {from: merchant});
      const timestamp = await time.latest();
      expectEvent(receipt, 'MintRequestAdd', { nonce: nonce, requester: merchant, amount: amount, deposit: deposit, txId: '', timestamp: timestamp });
    });

    it('other accounts cannot add a mint request', async function () {
      await expectRevert(factory.addMintRequest(amount, deposit, { from: other }),'WFILFactory: caller is not a merchant');
    });
  });

  describe('cancelMintRequest()', function () {
    beforeEach(async function () {
      await factory.setCustodianDeposit(merchant, deposit, { from: custodian });
    });

    it('merchant can cancel a mint request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.cancelMintRequest(requestHash, { from: merchant });
      const receipt = await factory.getMintRequest(nonce, {from: other});
      expect(receipt.status).to.equal('canceled');
    });

    it('should emit the appropriate event when a merchant cancel a mint request', async () => {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      const receipt = await factory.cancelMintRequest(requestHash, {from: merchant});
      expectEvent(receipt, 'MintRequestCancel', { nonce: nonce, requester: merchant, requestHash: requestHash });
    });

    it('other accounts cannot cancel a mint request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await expectRevert(factory.cancelMintRequest(requestHash, { from: other }),'WFILFactory: caller is not a merchant');
    });
  });

  describe('confirmMintRequest()', function () {
    beforeEach(async function () {
      await factory.setCustodianDeposit(merchant, deposit, { from: custodian });
    });

    it('custodian can confirm a mint request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.confirmMintRequest(requestHash, txId, { from: custodian });
      const receipt = await factory.getMintRequest(nonce, {from: other});
      expect(receipt.status).to.equal('approved');
    });

    it('should emit the appropriate event when a custodian confirm a mint request', async () => {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      const timestamp = logs[0].args.timestamp;
      const receipt = await factory.confirmMintRequest(requestHash, txId, {from: custodian});
      expectEvent(receipt, 'MintConfirmed', { nonce: nonce, requester: merchant, amount: amount, deposit: deposit, txId: txId, timestamp: timestamp, requestHash: requestHash });
    });

    it('other accounts cannot confirm a mint request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await expectRevert(factory.confirmMintRequest(requestHash, txId, { from: other }),'WFILFactory: caller is not a custodian');
    });
  });

  describe('rejectMintRequest()', function () {
    beforeEach(async function () {
      await factory.setCustodianDeposit(merchant, deposit, { from: custodian });
    });

    it('custodian can reject a mint request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.rejectMintRequest(requestHash, { from: custodian });
      const receipt = await factory.getMintRequest(nonce, {from: other});
      expect(receipt.status).to.equal('rejected');
    });

    it('should emit the appropriate event when a custodian reject a mint request', async () => {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      const timestamp = logs[0].args.timestamp;
      const receipt = await factory.rejectMintRequest(requestHash, {from: custodian});
      expectEvent(receipt, 'MintRejected', { nonce: nonce, requester: merchant, amount: amount, deposit: deposit, txId: '', timestamp: timestamp, requestHash: requestHash });
    });

    it('other accounts cannot reject a mint request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await expectRevert(factory.rejectMintRequest(requestHash, { from: other }),'WFILFactory: caller is not a custodian');
    });
  });

  describe('burn()', function () {
    beforeEach(async function () {
      await factory.setCustodianDeposit(merchant, deposit, { from: custodian });
      await factory.setMerchantDeposit(deposit, { from: merchant });
    });

    it('merchant can burn wrapped filecoin', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.confirmMintRequest(requestHash, txId, { from: custodian });

      const balanceBefore = await wfil.balanceOf(merchant);
      expect(balanceBefore).to.be.bignumber.equal(amount);

      await wfil.increaseAllowance(factory.address, amount, { from: merchant });
      await factory.burn(amount, { from: merchant });

      const balanceAfter = await wfil.balanceOf(merchant);
      expect(balanceAfter).to.be.bignumber.equal('0');
    });

    it('should emit the appropriate event when a merchant burn wrapped filecoin', async () => {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.confirmMintRequest(requestHash, txId, {from: custodian});
      await wfil.increaseAllowance(factory.address, amount, { from: merchant });
      const receipt = await factory.burn(amount, { from: merchant });
      const timestamp = receipt.logs[0].args.timestamp;
      const burnHash = receipt.logs[0].args.requestHash;
      expectEvent(receipt, 'Burned', { nonce: nonce, requester: merchant, amount: amount, deposit: deposit, timestamp: timestamp, requestHash: burnHash });
    });

    it('other accounts cannot burn wrapped filecoin', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.confirmMintRequest(requestHash, txId, { from: custodian });
      await wfil.increaseAllowance(factory.address, amount, { from: merchant });
      await expectRevert(factory.burn(amount, { from: other }),'WFILFactory: caller is not a merchant');
    });
  });

  describe('confirmBurnRequest()', function () {
    beforeEach(async function () {
      await factory.setCustodianDeposit(merchant, deposit, { from: custodian });
      await factory.setMerchantDeposit(deposit, { from: merchant });
    });

    it('merchant can confirm a burn request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.confirmMintRequest(requestHash, txId, { from: custodian });
      await wfil.increaseAllowance(factory.address, amount, { from: merchant });
      const burn = await factory.burn(amount, { from: merchant });
      const burnHash = burn.logs[0].args.requestHash;
      await factory.confirmBurnRequest(burnHash, txId, { from: custodian });
      const receipt = await factory.getBurnRequest(nonce, {from: other});
      expect(receipt.status).to.equal('approved');
    });

    it('should emit the appropriate event when a merchant confirm a burn request', async () => {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.confirmMintRequest(requestHash, txId, {from: custodian});
      await wfil.increaseAllowance(factory.address, amount, { from: merchant });
      const burn = await factory.burn(amount, { from: merchant });
      const timestamp = burn.logs[0].args.timestamp;
      const burnHash = burn.logs[0].args.requestHash;
      const receipt = await factory.confirmBurnRequest(burnHash, txId, { from: custodian });
      expectEvent(receipt, 'BurnConfirmed', { nonce: nonce, requester: merchant, amount: amount, deposit: deposit, txId: txId, timestamp: timestamp, inputRequestHash: burnHash });
    });

    it('other accounts cannot confirm a burn request', async function () {
      const { logs } = await factory.addMintRequest(amount, deposit, { from: merchant });
      const requestHash = logs[0].args.requestHash;
      await factory.confirmMintRequest(requestHash, txId, { from: custodian });
      await wfil.increaseAllowance(factory.address, amount, { from: merchant });
      const burn = await factory.burn(amount, { from: merchant });
      const burnHash = burn.logs[0].args.requestHash;
      await expectRevert(factory.confirmBurnRequest(burnHash, txId, { from: other }),'WFILFactory: caller is not a custodian');
    });
  });

  describe('reclaimToken()', function () {
    beforeEach(async function () {
      await wfil.addMinter(minter, { from: dao });
      await wfil.wrap(factory.address, amount, { from: minter });
    });

    it('owner can reclaim erc20 tokens sent to factory contract', async function () {
      await factory.reclaimToken(wfil.address, { from: owner });
      expect(await wfil.balanceOf(factory.address)).to.be.bignumber.equal('0');
    });

    it("should emit the appropriate event when an erc20 token is claimed", async () => {
      const receipt = await factory.reclaimToken(wfil.address, {from:owner});
      expectEvent(receipt, "TokenClaimed", { token: wfil.address, amount: amount });
    });

    it('other accounts cannot reclaim erc20 tokens', async function () {
      await expectRevert(factory.reclaimToken(wfil.address, { from: other }),'WFILFactory: caller is not the default admin');
    });
  });

  describe("addCustodian()", async () => {
      it("default admin should be able to add a new custodian", async () => {
        await factory.addCustodian(custodian2, {from:owner});
        expect(await factory.getRoleMember(CUSTODIAN_ROLE, 1)).to.equal(custodian2);
      });

      it("should emit the appropriate event when a new custodian is added", async () => {
        const receipt = await factory.addCustodian(custodian2, {from:owner});
        expectEvent(receipt, "RoleGranted", { account: custodian2 });
      });

      it("should revert when account is set to zero address", async () => {
        await expectRevert(factory.addCustodian(ZERO_ADDRESS, {from:owner}), 'WFILFactory: account is the zero address');
      });

      it("other address should not be able to add a new custodian", async () => {
        await expectRevert(factory.addCustodian(custodian2, {from:other}), 'WFILFactory: caller is not the default admin');
      });
  });

  describe("removeCustodian()", async () => {
      it("default admin should be able to remove a custodian", async () => {
        await factory.removeCustodian(custodian, {from:owner});
        expect(await factory.hasRole(CUSTODIAN_ROLE, custodian)).to.equal(false);
      });

      it("should emit the appropriate event when a custodian is removed", async () => {
        const receipt = await factory.removeCustodian(custodian, {from:owner});
        expectEvent(receipt, "RoleRevoked", { account: custodian });
      });

      it("other address should not be able to remove a custodian", async () => {
        await expectRevert(factory.removeCustodian(custodian, {from: other}), 'WFILFactory: caller is not the default admin');
      });
  });

  describe("addMerchant()", async () => {
      it("default admin should be able to add a new merchant", async () => {
        await factory.addMerchant(merchant2, {from:owner});
        expect(await factory.getRoleMember(MERCHANT_ROLE, 1)).to.equal(merchant2);
      });

      it("should emit the appropriate event when a new merchant is added", async () => {
        const receipt = await factory.addMerchant(merchant2, {from:owner});
        expectEvent(receipt, "RoleGranted", { account: merchant2 });
      });

      it("should revert when account is set to zero address", async () => {
        await expectRevert(factory.addMerchant(ZERO_ADDRESS, {from:owner}), 'WFILFactory: account is the zero address');
      });

      it("other address should not be able to add a new merchant", async () => {
        await expectRevert(factory.addMerchant(merchant2, {from:other}), 'WFILFactory: caller is not the default admin');
      });
  });

  describe("removeMerchant()", async () => {
      it("default admin should be able to remove a merchant", async () => {
        await factory.removeMerchant(merchant, {from:owner});
        expect(await factory.hasRole(MERCHANT_ROLE, merchant)).to.equal(false);
      });

      it("should emit the appropriate event when a merchant is removed", async () => {
        const receipt = await factory.removeMerchant(merchant, {from:owner});
        expectEvent(receipt, "RoleRevoked", { account: merchant });
      });

      it("other address should not be able to remove a merchant", async () => {
        await expectRevert(factory.removeMerchant(merchant, {from: other}), 'WFILFactory: caller is not the default admin');
      });
  });
});
