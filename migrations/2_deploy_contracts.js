var WFIL = artifacts.require("WFIL");
var WFILFactory = artifacts.require("WFILFactory");
const rinkeby = require('./rinkeby');

module.exports = function(deployer) {
	deployer.deploy(WFIL, rinkeby.wfil.dao).then(function() {
		return deployer.deploy(WFILFactory, WFIL.address, rinkeby.wfil.dao);
	});
};
