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

const dummyLogger = {
  log() {},
  logNoNL() {},
  hideCursor() {},
  showCursor() {}
};

const requires = [];
const match = [];
const reporter = 'spec';
const timeout = 2000;

test('should spawn processes for process pool', () => {
  const files = [
    'test-files/passing-tests.js',
    'test-files/more-passing-tests.js',
  ];
  const processCount = 2;
  return runner.run(files, match, requires, processCount, reporter, timeout, dummyLogger)
    .then((results) => {
      assert.equal(results.successes, 6, 'should be 6 passing tests');
      assert.equal(childProcess.fork.callCount, 2, 'Should spawn two processes');
    });
});

test('should reuse process if test files are greater than processes', () => {
  const processCount = 1;
  const files = [
    'test-files/passing-tests.js',
    'test-files/more-passing-tests.js'
  ];
  return runner.run(files, match, requires, processCount, reporter, timeout, dummyLogger)
    .then((results) => {
      assert.equal(results.successes, 6, 'should be 6 passing tests');
      assert.equal(childProcess.fork.callCount, 1, 'Should spawn one processes');
    });
});

test('should send environment varible with process index', () => {
  const processCount = 2;
  const files = [
    'test-files/pass-if-process-index-1.js',
    'test-files/pass-if-process-index-1.js'
  ];
  return runner.run(files, match, requires, processCount, reporter, timeout, dummyLogger)
    .then((results) => {
      assert.equal(results.successes, 1, 'should be one passing test');
      assert.equal(results.errors, 1, 'should be one failing test');
    });

});
