const test = require('../../lib/kuta').test;
const assert = require('assert');

const { promisedSpawn } = require('../helpers/spawn');
  
test('passing tests', () => {
  return promisedSpawn('./bin/cli.js', ['test-files/passing-tests.js'])
    .then(({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 0);
      assert.equal(passedCount, 3);
    });
    
});

test('failing tests', () => {
  return promisedSpawn('./bin/cli.js', ['test-files/failing-tests.js'])
    .then(({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 4);
      assert.equal(passedCount, 0);
    });
});

test('fail by timeout', () => {
  return promisedSpawn('./bin/cli.js', ['test-files/slow-test.js', '-t', '100'])
    .then(({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 1);
      assert.equal(passedCount, 0);
    });
});


