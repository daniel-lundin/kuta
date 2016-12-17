const assert = require('assert');
const sinon = require('sinon');
const childProcess = require('child_process');

const test = require('../lib/kuta.js').test;
const runner = require('../lib/runner');

test.before(() => {
  console.log('before');
  sinon.spy(childProcess, 'fork');
});

test.after(() => {
  console.log('after');
  childProcess.fork.restore();
});

test('should spawn processes for process pool', () => {
  const requires = [];
  const processCount = 2;
  return runner.run(['test-files/passing-tests.js'], requires, processCount)
    .then((results) => {
      assert.equal(childProcess.fork.callCount, 2, "Should spawn two processes");
    });
});
