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
  const logger = () => {};
  return runner.run(files, requires, processCount, logger)
    .then((results) => {
      assert.equal(results.successes, 6, 'should be 6 passing tests');
      assert.equal(childProcess.fork.callCount, 2, 'Should spawn two processes');
    });
});
