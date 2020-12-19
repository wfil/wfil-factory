[![#ubuntu 18.04](https://img.shields.io/badge/ubuntu-v18.04-orange?style=plastic)](https://ubuntu.com/download/desktop)
[![#node 12.19.0](https://img.shields.io/badge/node-v12.19.0-blue?style=plastic)](https://github.com/nvm-sh/nvm#installation-and-update)
[![#built_with_Truffle](https://img.shields.io/badge/built%20with-Truffle-blueviolet?style=plastic)](https://www.trufflesuite.com/)
[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF?style=plastic)](https://docs.openzeppelin.com/)
[![#solc 0.6.12](https://img.shields.io/badge/solc-v0.6.12-brown?style=plastic)](https://github.com/ethereum/solidity/releases/tag/v0.6.12)
[![#mainnet wfil-factory](https://img.shields.io/badge/mainnet-WFILFactory-purple?style=plastic&logo=Ethereum)](https://etherscan.io/address/)

# WFIL Factory

> WFIL Factory

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
**WFIL Factory (Rinkeby):** [0x865FF75B4cB65782aA3Ae0c959a561Ae2f743096](https://rinkeby.etherscan.io/address/0x865FF75B4cB65782aA3Ae0c959a561Ae2f743096#code)  

## Current Mainnet Contracts (3/12/2020)
* **WFIL DAO:** [0x44443407e196298a0aD68207Aa93eA919df53961](https://etherscan.io/address/0x44443407e196298a0aD68207Aa93eA919df53961)  
* **WFIL:** [0xd187C6C8C6aeE0F021F92cB02887A21D529e26cb](https://etherscan.io/address/0xd187C6C8C6aeE0F021F92cB02887A21D529e26cb#code)  

Audit
=====

* [Quantstamp]()

About
============
## Inspiration & References

[![Awesome WFIL](https://img.shields.io/badge/Awesome-WFIL-blue)](https://github.com/wfil/awesome-wfil/blob/master/README.md#references)

