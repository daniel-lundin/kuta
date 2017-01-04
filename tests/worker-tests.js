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

test.afterEach(() => {
  childProcess.fork.reset();
});

test('should spawn processes for process pool', () => {
  const requires = [];
  const processCount = 2;
  const files = [
    'test-files/passing-tests.js',
    'test-files/more-passing-tests.js'
  ];
  const logger = () => {};
  const timeout = 2000;
  return runner.run(files, requires, processCount, timeout, logger)
    .then((results) => {
      assert.equal(results.successes, 4, 'should be 6 passing tests');
      assert.equal(childProcess.fork.callCount, 2, 'Should spawn two processes');
    });
});

test('should reuse process if test files are greater than processes', () => {
  const requires = [];
  const processCount = 1;
  const files = [
    'test-files/passing-tests.js',
    'test-files/more-passing-tests.js'
  ];
  const logger = () => {};
  const timeout = 2000;
  return runner.run(files, requires, processCount, timeout, logger)
    .then((results) => {
      assert.equal(results.successes, 4, 'should be 6 passing tests');
      assert.equal(childProcess.fork.callCount, 1, 'Should spawn one processes');
    });
});
