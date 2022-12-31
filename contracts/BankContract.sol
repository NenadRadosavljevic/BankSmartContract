// SPDX-License-Identifier: MIT

pragma solidity >=0.8.11;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


error TokenTransferFailed();
error NeedsMoreThanZero();
error ZeroAddress();
error InsufficientBalance();
error InsufficientAllowance();

contract BankContract is Ownable, Pausable, ReentrancyGuard {

    string public constant name = "Bank staking contract";

    // Stake and reward token.
    IERC20 immutable token;

    // token reward pool of ERC20 tokens
    uint256 private immutable totalRewardSupply;
    // current withdrawn amount of staking rewards
    uint256 private withdrawnRewards;
    // time constant in seconds for deposit, lock and 3 sub-pool periods
    uint256 immutable T; 
    // initial time t0 when contract starts executing
    // in seconds (elapsed from epoch)
    // time periods
    uint256 private t_zero;  
    uint256 private t_deposit_period_end;  
    uint256 private t_lock_period_end;
    uint256 private t_withdraw_r1_period_end;
    uint256 private t_withdraw_r2_period_end;
    
    // current number of participants
    uint256 private stakersCount;
    // current amount of deposited balance
    uint256 private totalStakedBalance;
    // last time participant withdrew funds
    uint256 private t_last_withdraw;

    struct StakeInfo {        
        uint256 depositTime;
        uint256 withdrawTime;        
        uint256 amount; 
        uint256 reward;       
    }

    mapping(address => StakeInfo) private stakers;

    modifier moreThanZero(uint256 amount) {
        if (amount == 0) {
            revert NeedsMoreThanZero();
        }
        _;
    }

    modifier isZeroAddress(address _address) {
        if (_address == address(0)) {
            revert ZeroAddress();
        }
        _;
    }

    modifier checkSufficientAccountBalance(address _address, uint256 amount) {
        if (token.balanceOf(_address) < amount) {
            revert InsufficientBalance();
        }
        _;
    }

    modifier isSpenderApproved(address owner, address spender, uint256 amount) {
        if (token.allowance(owner, spender) < amount) {
            revert InsufficientAllowance();
        }
        _;
    }

    event Staked(address indexed from, uint256 amount, uint256 time);
    event UnstakedAndRewarded(address indexed from, uint256 amount, uint256 time);
    event BankTokensWithdrawn(address indexed from, uint256 amount, uint256 time);
 
    // "token reward pool of R XYZ tokens, deposited to the contract by the contract owner (bank owner) at contract deployment."
    // let's assume contract deployment has three steps:
    // 1. contract creation
    // 2. owner funds the bank contract account with reward tokens
    // 3. contract initialization, when bank contract becomes active (unpaused).
  
    constructor(address _tokenAddress, uint256 _totalRewardSupply, uint256 timeConstant) 
        isZeroAddress(_tokenAddress) 
        moreThanZero(_totalRewardSupply) 
    {
        token = IERC20(_tokenAddress);
        totalRewardSupply = _totalRewardSupply;
        T = timeConstant;

        // pause the contract until the owner funds the account and call the init function
        _pause();
    }

    // starting contract if owner already funded bank contract with sufficient reward pool tokens
    function contractInit() 
        external 
        onlyOwner 
        whenPaused 
        checkSufficientAccountBalance(address(this), totalRewardSupply)
    {
        withdrawnRewards = 0;

        t_zero = block.timestamp;
        t_deposit_period_end = t_zero + T;
        t_lock_period_end = t_zero + 2*T;
        t_withdraw_r1_period_end = t_zero + 3*T;
        t_withdraw_r2_period_end = t_zero + 4*T;

        _unpause();
    }

    // Override Ownable renounceOwnership function
    function renounceOwnership() public view override onlyOwner {
        require(false, "Can't renounce contract ownership.");
    }

    //staking tokens - and owner is able to stake coins
    function depositTokens(uint256 _amount) 
        external
        moreThanZero(_amount)
        isSpenderApproved(msg.sender,address(this),_amount)
        checkSufficientAccountBalance(msg.sender,_amount) 
        whenNotPaused
        nonReentrant
    { 
        require(block.timestamp >= t_zero, "Deposit period is not started yet!");      
        require(block.timestamp < t_deposit_period_end, "Deposit period expired!"); 
        require(stakers[msg.sender].depositTime == 0, "You've already participated!");
        
        // update the participant staking info
        stakers[msg.sender].depositTime = block.timestamp;
        stakers[msg.sender].amount = _amount;
        // update the staking global info
        stakersCount++;
        totalStakedBalance += _amount;

        //transfering token for staking
        bool success = token.transferFrom(msg.sender, address(this), _amount);       
        if (!success) {
            revert TokenTransferFailed(); 
        }    
        emit Staked(msg.sender, _amount, block.timestamp);
    }

    // called by participants to unstake and get reward
    function withdrawTokensWithReward() 
        external
        whenNotPaused
        nonReentrant
    { 
        require(t_lock_period_end <= block.timestamp, "Withdraw period is not started yet!");      
        require(stakers[msg.sender].depositTime != 0, "You haven't been participant!");
        require(stakers[msg.sender].withdrawTime == 0, "You've already withdraw the funds!");

        uint reward = calculateReward();

        // update the participant staking info
        stakers[msg.sender].withdrawTime = block.timestamp;
        stakers[msg.sender].reward = reward;
        // update the staking global info
        stakersCount--;
        totalStakedBalance -= stakers[msg.sender].amount;
        // remainingRewardSupply -= reward;
        withdrawnRewards += reward;
        // update last time when participant withdrew funds
        t_last_withdraw = block.timestamp;
        // calculate amount to transfer
        uint sum_amount = stakers[msg.sender].amount + reward;
        //transfering tokens, participant stake and reward
        bool success = token.transfer(msg.sender, sum_amount);        
        if (!success) {
            revert TokenTransferFailed(); 
        }    
        emit UnstakedAndRewarded(msg.sender, sum_amount, block.timestamp);
    }

    function calculateReward() 
        private 
        view 
        returns(uint256)
    {
        uint256 R = 100; // reward pool
        // 3 subpools
        uint256 R1 = 20; // pool allocation R1
        uint256 R2 = 30; // pool allocation R2
        //uint256 R3 = 50; // pool allocation R3
        // remaining unlocked tokens for rewards in subpool
        uint256 SubPoolSupply;

        if(t_lock_period_end <= block.timestamp && block.timestamp < t_withdraw_r1_period_end)
        {
            // R1 - unlocked 20% pool for rewards
            SubPoolSupply = totalRewardSupply*R1/R - withdrawnRewards;
        } 
        else if(t_withdraw_r1_period_end <= block.timestamp && block.timestamp < t_withdraw_r2_period_end)
        {
            // R2 + remainder R1 = unlocked 20% + 30% - already withdrawn rewards
            SubPoolSupply = totalRewardSupply*(R1+R2)/R - withdrawnRewards;
        }
        else if(t_withdraw_r2_period_end <= block.timestamp)
        {
            // R3 + remainders R1 and R2 = unlocked 20% + 30% + 50% - already withdrawn rewards
            SubPoolSupply = totalRewardSupply - withdrawnRewards;
        }

        return SubPoolSupply * stakers[msg.sender].amount / totalStakedBalance;
    }
   

    // bank is able to remove the remaning reward after all stakers left the pool before R3 period.
    // in R3 period if at least one stakers remains, bank can't withraw remaining rewards anymore.
    function withdrawBankRemainingReward() 
        external
        onlyOwner
        whenNotPaused
        nonReentrant
    {
        require(t_withdraw_r2_period_end < block.timestamp, "Bank owner can't withdraw before R3 period starts.");
        require(stakersCount == 0, "Not all stakers left the pool."); 
        require(t_last_withdraw < t_withdraw_r2_period_end, "There were withdraws in R3 period.");
        require(token.balanceOf(address(this)) > 0, "No more tokens left in the pool.");

        // remaining reward amount collected by the Bank owner
        uint remainingRewardSupply = totalRewardSupply - withdrawnRewards; // token.balanceOf(address(this));
        withdrawnRewards = totalRewardSupply;
        // Bank transfers remaining reward tokens
        bool success = token.transfer(msg.sender, remainingRewardSupply);      
        if (!success) {
            revert TokenTransferFailed(); 
        }    
        emit BankTokensWithdrawn(msg.sender, remainingRewardSupply, block.timestamp);
    }

    function getCurrentNumberOfParticipants() public view returns(uint256){
        return stakersCount;
    }

    function getCurrentStakedBalance() public view returns(uint256){
        return totalStakedBalance;
    }

    function getStakingBalance() public view returns(uint256){
        return stakers[msg.sender].amount;
    }

    function getWithdrawnStakeWithReward() public view returns(uint256){
        require(stakers[msg.sender].depositTime != 0 && stakers[msg.sender].withdrawTime != 0,
        "Not participant or still staking!");
        return stakers[msg.sender].amount + stakers[msg.sender].reward;
    }

    function getRemainingRewardSupply() public view returns(uint256){
        return totalRewardSupply - withdrawnRewards;
    }
   
}
