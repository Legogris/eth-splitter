pragma solidity ^0.4.4;

import "./ConvertLib.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract Splitter {
	mapping (address => uint) public balances;
	address public owner;
	address public recipient1;
	address public recipient2;

	event Fund(address _recipient, uint256 _value, uint256 _total);
	event Withdraw(address _recipient, uint256 _value);

	function Splitter(address _owner, address _recipient1, address _recipient2) {
		owner = _owner;
		require(_owner != 0 && _recipient1 != 0 && _recipient2 != 0);
		recipient1 = _recipient1;
		recipient2 = _recipient2;
	}

	function getBalance(address addr) returns(uint) {
		require(addr == recipient1 || addr == recipient2);
		return balances[addr];
	}

	function withdraw() {
		uint256 amount;
		require(msg.sender == recipient1 || msg.sender == recipient2);
		address recipient = msg.sender;
		amount = balances[recipient];
		require(amount > 0);
		balances[recipient] = 0;
		recipient.transfer(amount);
		Withdraw(recipient, amount);
	}

	function kill() {
		require(msg.sender == owner);
		selfdestruct(owner);
	}

	function () payable {
		require(msg.sender == owner);
		require(msg.value % 2 == 0);
		require(msg.value > 0);
		uint256 amount = msg.value / 2;
		balances[recipient1] += amount;
		Fund(recipient1, amount, balances[recipient1]);
		balances[recipient2] += amount;
		Fund(recipient2, amount, balances[recipient2]);
	}
}
