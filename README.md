[![#ubuntu 18.04](https://img.shields.io/badge/ubuntu-v18.04-orange?style=plastic)](https://ubuntu.com/download/desktop)
[![#node 12.19.0](https://img.shields.io/badge/node-v12.19.0-blue?style=plastic)](https://github.com/nvm-sh/nvm#installation-and-update)
[![#built_with_Truffle](https://img.shields.io/badge/built%20with-Truffle-blueviolet?style=plastic)](https://www.trufflesuite.com/)
[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF?style=plastic)](https://docs.openzeppelin.com/)
[![#solc 0.6.12](https://img.shields.io/badge/solc-v0.6.12-brown?style=plastic)](https://github.com/ethereum/solidity/releases/tag/v0.6.12)
[![#mainnet wfil-factory](https://img.shields.io/badge/mainnet-WFILFactory-purple?style=plastic&logo=Ethereum)](https://etherscan.io/address/)

# WFIL Factory

> WFIL Factory

WFIL Factory allow Merchants and Custodians to interact with WFIL ERC20 Wrapper.  
WFIL DAO can add/remove Merchants and Custodians providing trust and transparency for the community.  
Merchants can add WFIL Mint/Burn requests that need to be confirmed by Custodians.  

## Sections
* [Building Blocks](#building-blocks)
* [Setup](#setup)
* [Audit](#audit)
* [About](#about)

## Building Blocks

![WFIL Factory Flow-Chart](WFIL_DAO.png)

### [WFILFactory](./contracts/WFILFactory.sol)


Setup
============

Clone this GitHub repository.

## Steps to compile and test

  - Local dependencies:
    - Truffle
    - Ganache CLI
    - OpenZeppelin Contracts v3.2.0
    - Truffle HD Wallet Provider
    - Truffle-Plugin-Verify
    - Solhint
    ```sh
    $ npm i
    ```
  - Global dependencies:
    - Truffle (recommended):
    ```sh
    $ npm install -g truffle
    ```
    - Ganache CLI (recommended):
    ```sh
    $ npm install -g ganache-cli
    ```
    - Slither (optional):
    ```sh
    $ git clone https://github.com/crytic/slither.git && cd slither
    $ sudo python3 setup.py install
    ```
## Running the project with local test network (ganache-cli)

   - Start ganache-cli with the following command (global dependency):
     ```sh
     $ ganache-cli
     ```
   - Compile the smart contract using Truffle with the following command (global dependency):
     ```sh
     $ truffle compile
     ```
   - Deploy the smart contracts using Truffle & Ganache with the following command (global dependency):
     ```sh
     $ truffle migrate
     ```
   - Test the smart contracts using Mocha & OpenZeppelin Test Environment with the following command:
     ```sh
     $ npm test
     ```
   - Analyze the smart contracts using Slither with the following command (optional):
      ```sh
      $ slither .
      ```

## Development deployment
**DAO Multisig (Rinkeby):** [0x3bBcA3216Dbafdfa61B3bbAaCb9C6FEbe4C45f2F](https://rinkeby.etherscan.io/address/0x3bbca3216dbafdfa61b3bbaacb9c6febe4c45f2f#code)  
**WFIL (Rinkeby):** [0xA04bbe85d91C3125d577AF17e4EB5d4E579100Cf](https://rinkeby.etherscan.io/address/0xA04bbe85d91C3125d577AF17e4EB5d4E579100Cf#code)   
**WFIL Factory (Rinkeby):** [0xD27B309B0Fd0E251674a6A52765934ef961E38Df](https://rinkeby.etherscan.io/address/0xD27B309B0Fd0E251674a6A52765934ef961E38Df#code)  

## Current Mainnet Contracts
* **WFIL DAO:** [0x44443407e196298a0aD68207Aa93eA919df53961](https://etherscan.io/address/0x44443407e196298a0aD68207Aa93eA919df53961) [(Dec-03-2020 06:36:39 PM +UTC)](https://etherscan.io/tx/0x79b397ffc59d4dda40eb3488ba701192c0e433a6f2c6e1cd4903536f049f09af)  
* **WFIL:** [0xd187C6C8C6aeE0F021F92cB02887A21D529e26cb](https://etherscan.io/address/0xd187C6C8C6aeE0F021F92cB02887A21D529e26cb#code)  [(Dec-03-2020 09:31:02 PM +UTC)](https://etherscan.io/tx/0xd12905b430d37940e9268b068f5ef2fafc302b35e9c2f2a799d0e134a0f2d5eb)  
* **WFIL Factory:** [0x97A995E8b36A14C5586a19a99a282e9B53Ad890D](https://etherscan.io/address/0x97A995E8b36A14C5586a19a99a282e9B53Ad890D#code) [(Dec-20-2020 11:50:22 PM +UTC)](https://etherscan.io/tx/0x4fe82b203870066a3034dfc1b8df44be620150f6a8f45089ee755cf03073e8f4)  

Audit
=====

* [Quantstamp](./Quantstamp_Audit_Report.pdf)  

About
============
## Inspiration & References

[![Awesome WFIL](https://img.shields.io/badge/Awesome-WFIL-blue)](https://github.com/wfil/awesome-wfil/blob/master/README.md#references)
