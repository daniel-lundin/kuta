const spawn = require('child_process').spawn;
const test = require('../lib/kuta.js').test;
const assert = require('assert');

function promisedExec(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let stdout = '';

    process.on('close', (code) => {
      if (code === 0) {
        return resolve(stdout);
      }
      return reject(stdout);
    });

    process.stdout.on('data', (data) => {
      stdout += data;
    });
  });
}

test('return exit code 0 for passing tests', () => {
  return promisedExec('./bin/cli.js', ['test-files/passing-tests.js']);
});

test('return non-zero exit code for failing tests', () => {
  return promisedExec('./bin/cli.js', ['test-files/failing-tests.js'])
    .then(() => {
      assert(false, 'should not resolve');
    })
    .catch(() => {
      assert(true);
    });
});


test('exceptions in befores/afters mark tests in group failed', () => {
  return promisedExec('./bin/cli.js', ['test-files/failing-group.js'])
    .catch((stdout) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 2, 'Should be two failing tests');
      assert.equal(passedCount, 1, 'Should be one passing tests');
    });
});
