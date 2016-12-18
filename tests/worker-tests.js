const assert = require('assert');
const sinon = require('sinon');
const childProcess = require('child_process');

const test = require('../lib/kuta.js').test;
const runner = require('../lib/runner');

test.before(() => {
  sinon.spy(childProcess, 'fork');
});

test.after(() => {
  childProcess.fork.restore();
});

test('should spawn processes for process pool', () => {
  const requires = [];
  const processCount = 2;
  const files = [
    'test-files/passing-tests.js',
    'test-files/passing-tests.js',
    'test-files/passing-tests.js'
  ];
  return runner.run(files, requires, processCount)
    .then(() => {
      assert.equal(childProcess.fork.callCount, 2, 'Should spawn two processes');
    });
});
