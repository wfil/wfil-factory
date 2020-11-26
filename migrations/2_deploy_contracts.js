var WFIL = artifacts.require("WFIL");
var WFILFactory = artifacts.require("WFILFactory");
const rinkeby = require('./rinkeby');

module.exports = function(deployer) {
	deployer.deploy(WFIL, rinkeby.wfil.minter).then(function() {
		return deployer.deploy(WFILFactory, WFIL.address);
	});
};
