const test = require('../../lib/kuta').test;
const assert = require('assert');

const { promisedSpawn } = require('../helpers/spawn');
 
test('lifecycle hooks should run in correct order', () => {
  return promisedSpawn('./bin/cli.js', ['test-files/lifecycles.js'])
    .then(({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 0, 'Should be zero failing tests');
      assert.equal(passedCount, 1, 'Should be one passing test');
    });
    
});

test('exceptions in befores/afters mark tests in group failed', () => {
  return promisedSpawn('./bin/cli.js', ['test-files/failing-group.js'])
    .then(({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 2, 'Should be two failing tests');
      assert.equal(passedCount, 1, 'Should be one passing tests');
    });
});


