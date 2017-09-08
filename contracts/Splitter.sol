pragma solidity ^0.4.4;

contract Splitter {
	mapping (address => uint) public balances;
	address public owner;
	address public recipient1;
	address public recipient2;

	event Fund(address _recipient, uint256 _value, uint256 _total);
	event Withdraw(address _recipient, uint256 _value);
	event Kill();

	function Splitter(address _owner, address _recipient1, address _recipient2) {
		owner = _owner;
		require(_owner != 0 && _recipient1 != 0 && _recipient2 != 0);
		recipient1 = _recipient1;
		recipient2 = _recipient2;
	}

	function withdraw() returns (bool success) {
		uint256 amount = balances[msg.sender];
		require(amount > 0);
		balances[msg.sender] = 0;
		msg.sender.transfer(amount);
		Withdraw(msg.sender, amount);
		return true;
	}

	function kill() returns (bool success) {
		require(msg.sender == owner);
		selfdestruct(owner);
		Kill();
		return true;
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
