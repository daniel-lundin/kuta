const test = require('../../lib/kuta').test;
const assert = require('assert');

const { promisedSpawn } = require('../helpers/spawn');

test('return exit code 0 for passing tests', () => {
  return promisedSpawn('./bin/cli.js', ['test-files/passing-tests.js'])
    .then(({ exitCode }) => {
      assert.equal(exitCode, 0, 'Exit code should be zero');
    });
});

test('return non-zero exit code for failing tests', () => {
  return promisedSpawn('./bin/cli.js', ['test-files/failing-tests.js'])
    .then(({ exitCode }) => {
      assert(exitCode !== 0, 'Exit code should be non-zero');
    });
});


