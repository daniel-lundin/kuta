const spawn = require('child_process').spawn;
const fs = require('fs');

const cli = require('../bin/cli');
const test = require('../lib/kuta').test;
const feature = require('../lib/bdd').feature;
const assert = require('assert');
const sinon = require('sinon');

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


feature('file watch', (scenario) => {
  scenario('trigger new run on file change', ({ before, after, given, when, then }) => {
    let fsWatchCallback;
    let clock;

    before(() => {
      sinon.stub(cli, 'clearScreen'); sinon.stub(fs, 'watch', (dir, callback) => { fsWatchCallback = callback; });
      sinon.stub(cli, 'startTests').returns(Promise.reject());
      clock = sinon.useFakeTimers();
    });

    after(() => {
      fs.watch.restore();
      cli.startTests.restore();
      clock.restore();
      cli.clearScreen.restore();
    });

    given('a directory watch', () => {
      cli.startWatch(['some dir']);
    });

    when('a file change is triggered', () => {
      fsWatchCallback();
      clock.tick(1000);
    });

    then('tests should run again', () => {
      assert(cli.startTests.calledOnce, 'startTests should have been called');
    });
  });

  scenario('wait for rerun until current test run is completed', ({ before, after, given, when, and, then }) => {
    let fsWatchCallback;
    let startTestsResolver;
    let clock;

    before(() => {
      sinon.stub(fs, 'watch', (dir, callback) => { fsWatchCallback = callback; });
      sinon.stub(cli, 'startTests').returns(new Promise((resolve) => {
        startTestsResolver = resolve;
      }));
      sinon.stub(cli, 'clearScreen');
      clock = sinon.useFakeTimers();
    });

    after(() => {
      fs.watch.restore();
      cli.startTests.restore();
      cli.clearScreen.restore();
      clock.restore();
    });

    given('a directory watch', () => {
      cli.startWatch(['some dir']);
    });

    when('a test run is started', () => {
      cli.runTests();
    });

    and('a file change is triggered', () => {
      fsWatchCallback();
      clock.tick(1000);
    });

    then('test should not restart', () => {
      assert(cli.startTests.calledOnce, 'Only one test run should have been triggered');
    });

    when('test run completes', () => {
      startTestsResolver();
    });

    then('tests should run again', () => {
      assert(cli.startTests.calledTwice, 'startTests should have been twice');
    });
  });
});
