# BankSmartContract

## Getting started
* Copy project to your directory ( `git clone https://github.com/NenadRadosavljevic/BankSmartContract` )
* Install project packages (`npm install`)
* Compile the project (`truffle compile`)

Required project packages
```bash
npm install @openzeppelin/contracts
npm install @openzeppelin/test-helpers
npm install chai-truffle
npm install chai-as-promised
npm install @truffle/hdwallet-provider
```

## For Testing
* To run the test, use the command: `truffle test`
There are three different test scenarios in a test folder. The first one is the same as described in the project task example.

Test output for the first one `truffle test test/bankTest1.js`
```
  Contract: BankContract
    Check starting balances
      ✔ participant 1 has tokens
      ✔ participant 2 has tokens
    ERC20 Token deployment
      ✔ has a name
    Bank Contract deployment
      ✔ has a name
      ✔ contract has tokens
      ✔ contract initialization is successful (60ms)
      ✔ Bank contract is activated
    Deposit period
      ✔ staking tokens by participants (672ms)
      ✔ checking staking balances (40ms)
      ✔ try to withdraw in deposit period (824ms)
    Lock period
      ✔ wait to start lock period
      ✔ try to deposit in lock period
      ✔ try to withdraw in lock period
      ✔ check number of participants
    withdraw R1 period
      ✔ wait to start R1 period
      ✔ participant 1, unstake and claims reward (283ms)
    withdraw R2 period
      ✔ wait to start R2 period
      ✔ participant 2, unstake and claims reward (280ms)
    withdraw R3 period
      ✔ wait to start R3 period
      ✔ check Bank Owner's remaining reward
      ✔ bank owner claims remaining reward (204ms)
    Check new balances and rewards
      ✔ participant 1 withdrew the required amount
      ✔ participant 1 new account balance
      ✔ participant 2 withdrew the required amount
      ✔ participant 2 new account balance
      ✔ confirm there are no remaining rewards in the pool


  26 passing (3s)
```

## Deployment to the Ethereum test network
* Deployment script for the ERC20 token and Bank Smart Contract is in `/migrations/2_deploy_contracts.js`.
* Configuration for the test networks and the providers are in `truffle-config.js`.

Due to Rinkeby being deprecated and discontinued in the early October, I have deployed contracts to the BNB Smart Chain Testnet and
Goerly.

Build and deploy contracts to the BSC and Goerly testnets
```bash
truffle compile
# deploy the contracts
truffle migrate --network bscTestnet --reset
truffle migrate --network goerly --reset
```
#
Current Admin on Test Net
* BSC, Goerly: 0xF0bf426Ad098a28f454E02f8A1f74E4E9Faafa28
#
BankContract Smart Contract Address on Test Net
* BSC: https://testnet.bscscan.com/address/0x17cbe405b27c3a13c520b20f2388116797e51f58#code
* Goerly: https://goerli.etherscan.io/address/0x17cbe405b27c3a13c520b20f2388116797e51f58#code
#
MyToken Contract Address on Test Net
* BSC: https://testnet.bscscan.com/address/0xc00641591cc41b1a4b24ea286b0bf4ff53f3cb6b#code
* Goerly: https://goerli.etherscan.io/address/0xc00641591cc41b1a4b24ea286b0bf4ff53f3cb6b#code

## Deployed info

https://testnet.bscscan.com/address/0xF0bf426Ad098a28f454E02f8A1f74E4E9Faafa28

```
Starting migrations...
======================
> Network name:    'bscTestnet'
> Network id:      97
> Block gas limit: 49803929 (0x2f7f299)


1_initial_migration.js
======================

   Deploying 'Migrations'
   ----------------------
   > transaction hash:    0xd8033b43fdc0484359e236bc8edc5c663e8832a00e4f89f1be7bb9d1776fac47
   > Blocks: 4            Seconds: 13
   > contract address:    0x6059e8023ba18db525527dcb4948a0aa4638677D
   > block number:        23671110
   > block timestamp:     1665678129
   > account:             0xF0bf426Ad098a28f454E02f8A1f74E4E9Faafa28
   > balance:             0.49727212
   > gas used:            272788 (0x42994)
   > gas price:           10 gwei
   > value sent:          0 ETH
   > total cost:          0.00272788 ETH

   Pausing for 10 confirmations...

   --------------------------------
   > confirmation number: 2 (block: 23671114)
   > confirmation number: 3 (block: 23671115)
   > confirmation number: 4 (block: 23671116)
   > confirmation number: 6 (block: 23671118)
   > confirmation number: 7 (block: 23671119)
   > confirmation number: 8 (block: 23671120)
   > confirmation number: 10 (block: 23671122)
   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.00272788 ETH


2_deploy_contracts.js
=====================

   Deploying 'MyToken'
   -------------------
   > transaction hash:    0xc4ec870b6d47cb7ff81d989c4e9306596d4907e590a053e88b443803bbf03974
   > Blocks: 3            Seconds: 9
   > contract address:    0xc00641591cc41b1A4B24eA286b0bF4ff53F3Cb6b
   > block number:        23671131
   > block timestamp:     1665678192
   > account:             0xF0bf426Ad098a28f454E02f8A1f74E4E9Faafa28
   > balance:             0.4851005
   > gas used:            1174627 (0x11ec63)
   > gas price:           10 gwei
   > value sent:          0 ETH
   > total cost:          0.01174627 ETH

   Pausing for 10 confirmations...

   --------------------------------
   > confirmation number: 2 (block: 23671135)
   > confirmation number: 3 (block: 23671136)
   > confirmation number: 4 (block: 23671137)
   > confirmation number: 6 (block: 23671139)
   > confirmation number: 7 (block: 23671140)
   > confirmation number: 8 (block: 23671141)
   > confirmation number: 10 (block: 23671143)

   Deploying 'BankContract'
   ------------------------
   > transaction hash:    0x67a930c6cdec9a17af17ec3878f3bd5b68c21b15095a353d694c808095cd86bc
   > Blocks: 5            Seconds: 13
   > contract address:    0x17CBe405b27c3a13C520B20F2388116797E51F58
   > block number:        23671149
   > block timestamp:     1665678246
   > account:             0xF0bf426Ad098a28f454E02f8A1f74E4E9Faafa28
   > balance:             0.46281048
   > gas used:            2229002 (0x22030a)
   > gas price:           10 gwei
   > value sent:          0 ETH
   > total cost:          0.02229002 ETH

   Pausing for 10 confirmations...

   --------------------------------
   > confirmation number: 2 (block: 23671153)
   > confirmation number: 3 (block: 23671154)
   > confirmation number: 4 (block: 23671155)
   > confirmation number: 6 (block: 23671157)
   > confirmation number: 7 (block: 23671158)
   > confirmation number: 8 (block: 23671159)
   > confirmation number: 10 (block: 23671161)
   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.03403629 ETH

Summary
=======
> Total deployments:   3
> Final cost:          0.03676417 ETH

```
