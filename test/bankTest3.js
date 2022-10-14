/** 
* There are no participants.
* Bank owner claims full reward in period R3.
*/

const { assert } = require('chai');
const { expect } = require('chai');
const { time } = require("@openzeppelin/test-helpers");

const MyERC20Token = artifacts.require('./MyToken');
const BankContract = artifacts.require('./BankContract');

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {
  return web3.utils.toWei(n.toString(), 'ether');
}

contract('BankContract', ([deployer]) => {

    let token, bankContract
    let totalRewardSupply = tokens(1000)
    let T = 60
    before(async()=>{
        token = await MyERC20Token.new()
        bankContract = await BankContract.new(token.address, totalRewardSupply, T)

        // transfer 1000 tokens to the Bank contract
        await token.transfer(bankContract.address, totalRewardSupply, {from:deployer})

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
            assert.equal(balance.toString(), tokens(1000))
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
    }) 
    
    // Lock period
    describe('Lock period', ()=>{
        it ('wait to start lock period', async()=>{           
            await time.increase(time.duration.seconds(T))  // T seconds
        })


        it('check number of participants', async () => {
            let numParticipants = await bankContract.getCurrentNumberOfParticipants()
            assert.equal(numParticipants.toString(), 0)
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

        it('too early bank claims remaining reward ', async () => {
            await expect(bankContract.withdrawBankRemainingReward({from:deployer})).to.be.rejectedWith('Bank owner can\'t withdraw before R3 period starts.')
        })     
    

    }) 
    
     // R3 period
     describe('withdraw R3 period', ()=>{
        it ('wait to start R3 period', async()=>{           
            await time.increase(time.duration.seconds(T+1))  // T+1 seconds
        })

        it('check Bank Owner\'s remaining reward', async () => {
            let remainingRewards = await bankContract.getRemainingRewardSupply()
            assert.equal(remainingRewards.toString(), tokens(1000))
        })

        it ('bank owner claims remaining reward', async()=>{           
            await bankContract.withdrawBankRemainingReward({from:deployer})
        })
    }) 
    
    describe('Check new balances and rewards', async()=>{ 

        it('confirm there are no remaining rewards in pool', async () => {
            let remainingRewards = await bankContract.getRemainingRewardSupply()
            assert.equal(remainingRewards.toString(), 0)
        }) 
    })    
    
})
