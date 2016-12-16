const exec = require('child_process').exec;
const test = require('../lib/kuta.js').test;
const assert = require('assert');

function promisedExec(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      return resolve(stdout);
    });
  });
}

test('return exit code 0 for passing tests', () => {
  return promisedExec('./bin/cli.js test-files/passing-tests.js')
});

test('return non-zero exit code for failing tests', () => {
  return promisedExec('./bin/cli.js test-files/failing-tests.js')
    .then(() => {
      assert(false, 'should not resolve');
    })
    .catch(() => {
      assert(true);
    });
});
