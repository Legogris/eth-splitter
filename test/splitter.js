var Splitter = artifacts.require('./Splitter.sol');

contract('Splitter', (accounts) => {
  it('should initialize with correct account mappings and 0 balances', () => {
    return Splitter.deployed()
      .then(instance => Promise.all([
        instance.owner(),
        instance.recipient1(),
        instance.recipient2(),
        instance.balances(accounts[1]),
        instance.balances(accounts[2]),
      ]))
      .then(([owner, rec1, rec2, balance1, balance2]) => {
        assert.equal(owner, accounts[0], 'owner not properly set');
        assert.equal(rec1, accounts[1], 'recipient1 not properly set');
        assert.equal(rec2, accounts[2], 'recipient2 not properly set');
        assert.equal(balance1, 0, 'balance for recipient1 not properly set');
        assert.equal(balance2, 0, 'balance for recipient2 not properly set');
      });
  });

  it('should not accept payments from anyone but owner', () => {
    return Splitter.deployed()
      .then(instance => instance.sendTransaction({
        value: web3.toWei(1, 'ether'),
        from: accounts[1]
      }))
      .then(assert.fail)
      .catch(err => assert.include(err.message, 'invalid opcode'));
  });

  it('should update balances and emit event when funded', () => {
    const amount = web3.toBigNumber(web3.toWei(0.5, 'ether'))
    return Splitter.deployed()
      .then(instance => instance.sendTransaction({
          value: web3.toWei(1, 'ether'),
          from: accounts[0]
        })
        .then(({ logs }) => {
          assert.isObject(logs.find(({ args }) =>
            args._recipient === accounts[1]
              && amount.eq(args._value)
              && amount.eq(args._total)
          ));
          assert.isObject(logs.find(({ args }) =>
            args._recipient === accounts[2]
              && amount.eq(args._value)
              && amount.eq(args._total)
          ));
          return Promise.all([
            instance.balances(accounts[1]),
            instance.balances(accounts[2])
          ])
        })
        .then(([balance1, balance2]) => {
          assert.deepEqual(balance1, amount, 'balance for recipient1 not properly set');
          assert.deepEqual(balance2, amount, 'balance for recipient2 not properly set');
        }));
  });
});

// Clear state between runs

contract('Splitter', (accounts) => {
  it('should allow withdrawal after funding', () => {
    const oldBalance1 = web3.eth.getBalance(accounts[1]);
    const oldBalance2 = web3.eth.getBalance(accounts[2]);
    const amount = web3.toBigNumber(web3.toWei(0.5, 'ether'))
    return Splitter.deployed()
      .then(instance => instance.sendTransaction({
          value: web3.toWei(1, 'ether'),
          from: accounts[0]
        })
        .then(() => instance.withdraw({ from: accounts[1] }))
        .then(({ receipt }) => {
          const newBalance = web3.eth.getBalance(accounts[1]);
          const expectedBalance = amount.add(oldBalance1).sub(web3.eth.gasPrice * receipt.gasUsed);
          assert.deepEqual(expectedBalance, newBalance, 'receipient1 invalid balance after withdraw');
        })
        .then(() => instance.withdraw({ from: accounts[2] }))
        .then(({ receipt }) => {
          const newBalance = web3.eth.getBalance(accounts[2]);
          const expectedBalance = amount.add(oldBalance2).sub(web3.eth.gasPrice * receipt.gasUsed);
          assert.deepEqual(expectedBalance, newBalance, 'recipient2 invalid balance after withdraw');
        })
        .then(() => instance.withdraw({ from: accounts[1] }))
        .then(({ receipt }) => {
          const newBalance = web3.eth.getBalance(accounts[1]);
          const expectedBalance = amount.add(oldBalance1).sub(web3.eth.gasPrice * receipt.gasUsed);
          assert.deepEqual(expectedBalance, newBalance, 'receipient1 invalid balance after withdraw');
        })
        .then(assert.fail)
        .catch(err => assert.include(err.message, 'invalid opcode', 'should not allow withdrawing twice'))
      );
  });
  it('should not allow strangers to withdraw', () => {
    const amount = web3.toBigNumber(web3.toWei(0.5, 'ether'))
    return Splitter.deployed()
      .then(instance => instance.sendTransaction({
          value: web3.toWei(1, 'ether'),
          from: accounts[0]
        })
        .then(() => instance.withdraw({ from: accounts[3] }))
        .then(assert.fail)
        .catch(err => assert.include(err.message, 'invalid opcode', 'should not allow withdrawing twice'))
      );
  });
  it('should only allow owner to kill', () => {
    const amount = web3.toBigNumber(web3.toWei(0.5, 'ether'))
    return Splitter.deployed()
      .then(instance => instance.kill({ from: accounts[1] }))
      .then(assert.fail)
      .catch(err => assert.include(err.message, 'invalid opcode', 'should not allow withdrawing twice'));
  });
  // TODO: Write test checking that kill actually calls selfdestruct properly. Pointers? :)
});
