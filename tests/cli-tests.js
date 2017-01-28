const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const fs = require('fs');
const EventEmitter = require('events');

const cli = require('../bin/cli');
const logger = require('../lib/logger');
const test = require('../lib/kuta').test;
const feature = require('../lib/bdd').feature;
const assert = require('assert');
const sinon = require('sinon');

function processAsEmitter() {
  process = spawn('./bin/cli.js', ['-w', 'test-files', 'test-files/failing-tests.js']);
  let processClosed = false;
  let failures;
  let passes;
  const eventEmitter = new EventEmitter();

  process.stdout.on('data', (data) => {
    const matches = data.toString().match(/Failed: 2/g);
    if (matches && matches.length === 1) {
      testCompletedEmitter.emit('completed');
    }
  });

  process.on('close', () => {
    processClosed = true;
  });
}

function promisedExec(command, args, onData = () => {}) {
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
      if (onData) onData(data);
    });
  });
}

test('return exit code 0 for passing tests', () => {
  return promisedExec('./bin/cli.js', ['test-files/passing-tests.js']);
});

test('return non-zero exit code for failing tests', () => {
  let resolved = false;
  return promisedExec('./bin/cli.js', ['test-files/failing-tests.js'])
    .then(() => {
      resolved = true;
      assert(false, 'should not resolve');
    })
    .catch((err) => {
      assert(!resolved, err);
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
  scenario.before(() => {
    sinon.stub(cli, 'clearScreen');
  });

  scenario.after(() => {
    cli.clearScreen.restore();
  });

  scenario('trigger new run on file change', ({ before, after, given, when, then }) => {
    let fsWatchCallback;
    let clock;

    before(() => {
      sinon.stub(logger, 'log');
      sinon.stub(fs, 'watch', (dir, callback) => { fsWatchCallback = callback; });
      sinon.stub(cli, 'startTests').returns(Promise.reject());
      clock = sinon.useFakeTimers();
    });

    after(() => {
      fs.watch.restore();
      cli.startTests.restore();
      clock.restore();
      logger.log.restore();
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
    let clock;
    let fsWatchCallback;
    let startTestsResolver;

    before(() => {
      sinon.stub(fs, 'watch', (dir, callback) => { fsWatchCallback = callback; });
      sinon.stub(logger, 'log');
      sinon.stub(cli, 'startTests').returns(new Promise((resolve) => {
        startTestsResolver = resolve;
      }));
      clock = sinon.useFakeTimers();
    });

    after(() => {
      fs.watch.restore();
      cli.startTests.restore();
      clock.restore();
      logger.log.restore();
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

  scenario('should not exit on failures in watch mode', ({ after, given, when, then }) => {
    const testCompletedEmitter = new EventEmitter();
    let process;
    let processClosed = false;

    function waitForCommpletedRun() {
      return new Promise((resolve) => {
        testCompletedEmitter.on('completed', resolve);
      });
    }

    after(() => {
      process.kill();
    });

    given('a started kuta process', () => {
      process = spawn('./bin/cli.js', ['-w', 'test-files', 'test-files/failing-tests.js']);

      process.stdout.on('data', (data) => {
        const matches = data.toString().match(/Failed: 2/g);
        if (matches && matches.length === 1) {
          testCompletedEmitter.emit('completed');
        }
      });
      process.on('close', () => {
        processClosed = true;
      });
    });

    when('some time flies', () => {
      return waitForCommpletedRun();
    });

    when('a file is changed', () => {
      return new Promise((resolve, reject) => {
        exec('touch ./test-files/failing-tests.js', (error) => {
          if (error) return reject(error);
          return resolve();
        });
      });
    });

    when('some more time flies', () => {
      return waitForCommpletedRun();
    });

    then('process should not be killed', () => {
      assert.equal(processClosed, false);
    });
  });
});

feature('test matching', (scenario) => {
  scenario('should only run matching tests', () => {
  });
});
