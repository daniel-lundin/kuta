const assert = require('assert');

const test = require('../lib/kuta.js').test;
const runner = require('../lib/runner');

test('should run bdd-style tests', () => {
  const requires = [];
  const match = [];
  const processCount = 2;
  const files = [
    'test-files/bdd-file'
  ];
  return runner.run(files, match, requires, processCount)
    .then((results) => {
      assert.equal(results.successes, 3, 'should be 6 passing tests');
    });
});

test('should run jasmine-style tests', () => {
  const requires = [];
  const match = [];
  const processCount = 2;
  const files = [
    'test-files/jasmine-dsl'
  ];
  return runner.run(files, match, requires, processCount)
    .then((results) => {
      assert.equal(results.successes, 3, 'should be 6 passing tests');
    });
});

