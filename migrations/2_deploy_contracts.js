const MyERC20Token = artifacts.require('MyToken');
const bankContract = artifacts.require('BankContract');

module.exports = async function(deployer, network, accounts) {

  //deploying MyToken
  await deployer.deploy(MyERC20Token);
  //fetching back MyToken address
  const token = await MyERC20Token.deployed();

  //deploying Bank contract, passing token address, rewards amount and time constant
  await deployer.deploy(bankContract, token.address, '1000000000000000000000', '60');
  const bankStaking = await bankContract.deployed();

  //transfer 1000 Tokens to Bank smart contract for rewards
  await token.transfer(bankStaking.address, '1000000000000000000000');

  // call Init function and start execution, once Bank contract 
  // is funded with rewards tokens 
  await bankStaking.contractInit();
};

