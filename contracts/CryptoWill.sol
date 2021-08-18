// SPDX-License-Identifier: MIT

// This code has not been professionally audited, therefore I cannot make any promises about
// safety or correctness. Use at own risk.

pragma solidity >=0.4.22 <0.9.0;

contract CryptoWill {
    address payable public owner;
    address payable public beneficiary;
    uint public amount;
    uint lastCheckIn;
    uint interval;

    constructor(address payable _beneficiary, uint _interval) payable {
        owner = payable(msg.sender);
        lastCheckIn = block.timestamp;
        beneficiary = _beneficiary;
        interval = _interval;
        amount = msg.value;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner has access");
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "only beneficiary has access");
        _;
    }

    function deposit() external payable {
        require(msg.value > 0);
        amount += msg.value;
    }

    function withdraw(uint _withdrawAmount) external onlyOwner() {
        require(_withdrawAmount <= amount);
        owner.transfer(_withdrawAmount);
    }

    function claim() external onlyBeneficiary() {
        require(block.timestamp >= lastCheckIn + interval, "interval has not passed yet");
        selfdestruct(beneficiary);
    }

    function checkIn() public onlyOwner() {
        lastCheckIn = block.timestamp;
    }
}
