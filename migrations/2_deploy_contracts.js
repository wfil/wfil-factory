var WFILFactory = artifacts.require("WFILFactory");
const mainnet = require('./mainnet');

module.exports = function(deployer) {
	deployer.deploy(WFILFactory, mainnet.wfil.token, mainnet.wfil.dao);
};
