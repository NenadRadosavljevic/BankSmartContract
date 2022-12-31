/** 
* There are 2 participants.
* First one will withdraw in period R2.
* Second one will withdraw in period R3.
* Bank owner is without reward.
*/

const { assert } = require('chai');
const { expect } = require('chai');
const { time } = require("@openzeppelin/test-helpers");

const MyERC20Token = artifacts.require('./MyToken');
const BankContract = artifacts.require('./BankContract');


require('chai')
  .use(require('chai-as-promised'))
  // .use(require('chai-bignumber')())
  .should() 

function tokens(n) {
  return web3.utils.toWei(n.toString(), 'ether');
}
function toTokens(n) {
    return web3.utils.fromWei(n.toString(), 'ether');
}

contract('BankContract', ([deployer, participant1, participant2]) => {

    let token, bankContract
    let totalRewardSupply = tokens(1000)
    let T = 60
    let stakeTokens1 = tokens(2000)
    let stakeTokens2 = tokens(5000)

    before(async()=>{
        token = await MyERC20Token.new()
        bankContract = await BankContract.new(token.address, totalRewardSupply, T)

        // transfer 1000 tokens to the Bank contract
        await token.transfer(bankContract.address, totalRewardSupply, {from:deployer})

        // send token to participants
        await token.transfer(participant1, stakeTokens1, {from:deployer})
        await token.transfer(participant2, stakeTokens2, {from:deployer})

    })

    describe('Check starting balances', ()=>{
        it ('participant 1 has tokens', async()=>{           
            let balance = await token.balanceOf(participant1)
            assert.equal(balance.toString(), stakeTokens1)
        })

        it ('participant 2 has tokens', async()=>{           
            let balance = await token.balanceOf(participant2)
            assert.equal(balance.toString(), stakeTokens2)
        })
    })

    describe('ERC20 Token deployment', ()=>{
        it ('has a name', async()=>{           
            const name = await token.name()
            assert.equal(name, 'MyToken')
        })
    })

    describe('Bank Contract deployment', async()=>{
        it ('has a name', async()=>{
            const name = await bankContract.name()
            assert.equal(name, 'Bank staking contract')
        })
    
        it('contract has tokens', async () => {
            let balance = await token.balanceOf(bankContract.address)
            assert.equal(balance.toString(), totalRewardSupply)
        }) 
    
        it('contract initialization is successful', async () => {
            await bankContract.contractInit({from:deployer});
        })
    
        it('Bank contract is activated', async () => {
            let status = await bankContract.paused()
            // unpaused - pause==false
            assert.equal(status, false, 'Bank contract is started.')
        })
    })
    
    // Deposit period
    describe('Deposit period', ()=>{


        it ('staking tokens by participants', async()=>{           
            //approve and stake tokens
            // participant 1
            await token.approve(bankContract.address, stakeTokens1, {from:participant1})
            await bankContract.depositTokens(stakeTokens1, {from:participant1})
            // participant 2
            await token.approve(bankContract.address, stakeTokens2, {from:participant2})
            await bankContract.depositTokens(stakeTokens2, {from:participant2})
        })

        it('checking staking balances', async () => {
            let balance =  await bankContract.getStakingBalance({from:participant1})
            assert.equal(balance, stakeTokens1)

            balance = await token.balanceOf(participant1)
            assert.equal(balance, 0)

            balance = await bankContract.getStakingBalance({from:participant2})
            assert.equal(balance, stakeTokens2)

            balance = await token.balanceOf(participant2)
            assert.equal(balance, 0)

            // 2000 + 5000
            balance = await bankContract.getCurrentStakedBalance()
            assert.equal(balance, tokens(7000))

        }) 
    
        it('try to withdraw in deposit period', async () => {
           await expect(bankContract.withdrawTokensWithReward({from:participant1})).to.be.rejectedWith('Withdraw period is not started yet!')
        })        
    }) 
    
    // Lock period
    describe('Lock period', ()=>{
        it ('wait to start lock period', async()=>{           
            await time.increase(time.duration.seconds(T))  // T seconds
        })

        it('check number of participants', async () => {
            let numParticipants = await bankContract.getCurrentNumberOfParticipants()
            assert.equal(numParticipants.toString(), 2)
          }) 
    }) 
       
     // R1 period
     describe('withdraw R1 period', ()=>{
        it ('wait to start R1 period', async()=>{           
            await time.increase(time.duration.seconds(T))  // T seconds
        })
    

    })    
    
     // R2 period
     describe('withdraw R2 period', ()=>{
        it ('wait to start R2 period', async()=>{           
            await time.increase(time.duration.seconds(T))  // T seconds
        })

        it ('participant 1, unstake and claims reward', async()=>{           
            await bankContract.withdrawTokensWithReward({from:participant1})
        })

    }) 
    
     // R3 period
     describe('withdraw R3 period', ()=>{
        it ('wait to start R3 period', async()=>{           
            await time.increase(time.duration.seconds(T))  // T seconds
        })

        it ('bank owner claims remaining reward', async()=>{ 
            await expect(bankContract.withdrawBankRemainingReward({from:deployer})).to.be.rejectedWith('Not all stakers left the pool.')
        })

        it ('make some delay', async()=>{           
            await time.increase(time.duration.seconds(T/2))
        })

        it ('participant 2, unstake and claims reward', async()=>{           
            await bankContract.withdrawTokensWithReward({from:participant2})
        })

        it ('bank owner claims remaining reward', async()=>{ 
            await expect(bankContract.withdrawBankRemainingReward({from:deployer})).to.be.rejectedWith('There were withdraws in R3 period.')
        })

    }) 
    
    describe('Check new balances and rewards', async()=>{ 
        // participant 1 withdraw balance (stake+reward)
        let expectedBalance1 = '2142.857142857142857142'
        // participant 2 withdraw balance (stake+reward)
        let expectedBalance2 = '5857.142857142857142858'  
        let balance 

        it('participant 1 withdrew the required amount', async () => {
            balance = await bankContract.getWithdrawnStakeWithReward({from:participant1})
            assert.equal(toTokens(balance), expectedBalance1)
         })   
        it('participant 1 new account balance', async () => {
            balance = await token.balanceOf(participant1)
            assert.equal(toTokens(balance), expectedBalance1)
        })  
 
        it('participant 2 withdrew the required amount', async () => {
            balance = await bankContract.getWithdrawnStakeWithReward({from:participant2})
            assert.equal(toTokens(balance), expectedBalance2)
        }) 
        it('participant 2 new account balance', async () => {
            balance = await token.balanceOf(participant2)
            assert.equal(toTokens(balance), expectedBalance2)
        }) 

        it('confirm there are no remaining rewards in the pool', async () => {
            let remainingRewards = await bankContract.getRemainingRewardSupply()
            assert.equal(remainingRewards.toString(), 0)
        }) 
    })    

})
