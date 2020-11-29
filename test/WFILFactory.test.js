// based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/presets/ERC20PresetMinterPauser.test.js

// test/WFILFactory.test.js

const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, constants, expectEvent, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const WFIL = contract.fromArtifact('WFIL');
const WFILFactory = contract.fromArtifact('WFILFactory');

let wfil;
let factory;

describe('WFIL', function () {
const [ deployer, dao, owner, merchant, custodian, other ] = accounts;


const amount = ether('10');

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MERCHANT_ROLE = web3.utils.soliditySha3('MERCHANT_ROLE');
const CUSTODIAN_ROLE = web3.utils.soliditySha3('CUSTODIAN_ROLE');
const PAUSER_ROLE = web3.utils.soliditySha3('PAUSER_ROLE');

const ZERO = 0;

  beforeEach(async function () {
    wfil = await WFIL.new(dao, { from: deployer });
    factory = await WFILFactory.new(wfil.address, owner, { from: deployer });
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

  describe("addCustodian()", async () => {
      it("default admin should be able to add a new custodian", async () => {
        await factory.addCustodian(custodian, {from:owner});
        expect(await factory.getRoleMember(CUSTODIAN_ROLE, 0)).to.equal(custodian);
      })

      it("should emit the appropriate event when a new custodian is added", async () => {
        const receipt = await factory.addCustodian(custodian, {from:owner});
        expectEvent(receipt, "RoleGranted", { account: custodian });
      })

      it("should revert when account is set to zero address", async () => {
        await expectRevert(factory.addCustodian(ZERO_ADDRESS, {from:owner}), 'WFILFactory: account is the zero address');
      })

      it("other address should not be able to add a new custodian", async () => {
        await expectRevert(factory.addCustodian(custodian, {from:other}), 'WFILFactory: caller is not the default admin');
      })
  })

  describe("removeCustodian()", async () => {
      beforeEach(async () => {
        await factory.addCustodian(custodian, {from: owner});
      })

      it("default admin should be able to remove a custodian", async () => {
        await factory.removeCustodian(custodian, {from:owner});
        expect(await factory.hasRole(CUSTODIAN_ROLE, custodian)).to.equal(false);
      })

      it("should emit the appropriate event when a custodian is removed", async () => {
        const receipt = await factory.removeCustodian(custodian, {from:owner});
        expectEvent(receipt, "RoleRevoked", { account: custodian });
      })

      it("other address should not be able to remove a custodian", async () => {
        await expectRevert(factory.removeCustodian(custodian, {from: other}), 'WFILFactory: caller is not the default admin');
      })
  })

  describe("addMerchant()", async () => {
      it("default admin should be able to add a new merchant", async () => {
        await factory.addMerchant(merchant, {from:owner});
        expect(await factory.getRoleMember(MERCHANT_ROLE, 0)).to.equal(merchant);
      })

      it("should emit the appropriate event when a new merchant is added", async () => {
        const receipt = await factory.addMerchant(merchant, {from:owner});
        expectEvent(receipt, "RoleGranted", { account: merchant });
      })

      it("should revert when account is set to zero address", async () => {
        await expectRevert(factory.addMerchant(ZERO_ADDRESS, {from:owner}), 'WFILFactory: account is the zero address');
      })

      it("other address should not be able to add a new merchant", async () => {
        await expectRevert(factory.addMerchant(merchant, {from:other}), 'WFILFactory: caller is not the default admin');
      })
  })

  describe("removeMerchant()", async () => {
      beforeEach(async () => {
        await factory.addMerchant(merchant, {from: owner});
      })

      it("default admin should be able to remove a merchant", async () => {
        await factory.removeMerchant(merchant, {from:owner});
        expect(await factory.hasRole(MERCHANT_ROLE, merchant)).to.equal(false);
      })

      it("should emit the appropriate event when a merchant is removed", async () => {
        const receipt = await factory.removeMerchant(merchant, {from:owner});
        expectEvent(receipt, "RoleRevoked", { account: merchant });
      })

      it("other address should not be able to remove a merchant", async () => {
        await expectRevert(factory.removeMerchant(merchant, {from: other}), 'WFILFactory: caller is not the default admin');
      })
  })
});
