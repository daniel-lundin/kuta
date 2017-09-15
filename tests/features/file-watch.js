const assert = require('assert');

const feature = require('../../lib/bdd').feature;
const { spawn, kutaAsEmitter } = require('../helpers/spawn');

feature('file watch', (scenario) => {
  scenario('trigger new run on file change', ({ after, given, when, then, and }) => {
    let kutaEmitter;

    after(() => kutaEmitter.kill());

    given('a started test runner in watch mode', () => {
      kutaEmitter = kutaAsEmitter([
        '-w',
        'tests/fixtures/passing-tests.js',
        'tests/fixtures/passing-tests.js'
      ]);
    });

    when('test run completes', () =>
      kutaEmitter.waitForCompletedRun());

    and('a file change is triggered', () =>
      spawn('touch', ['tests/fixtures/passing-tests.js']));

    then('tests should run again', () =>
      kutaEmitter.waitForCompletedRun());
  });

  scenario('should not exit on failures in watch mode', ({ after, given, when, then }) => {
    let kutaProcessEmitter;

    after(() => {
      kutaProcessEmitter && kutaProcessEmitter.kill();
    });

    given('a started kuta process', () => {
      kutaProcessEmitter = kutaAsEmitter([
        '-w',
        'tests/fixtures/failing-tests.js',
        'tests/fixtures/failing-tests.js'
      ]);
    });

    when('some time flies', () => {
      return kutaProcessEmitter.waitForCompletedRun();
    });

    when('a file is changed', () =>
      spawn('touch', ['tests/fixtures/failing-tests.js']));

    when('some more time flies', () => {
      return kutaProcessEmitter.waitForCompletedRun();
    });

    then('process should not be killed', () => {
      assert.equal(kutaProcessEmitter.isClosed(), false);
    });
  });

  scenario('cancel current run on file change', ({ given, when, and, then }) => {
    let kutaEmitter;

    given('a started runner in watch mode', () => {
      kutaEmitter = kutaAsEmitter([
        '-p', '1',
        '-w', 'tests/fixtures/slow-tests.js',
        'tests/fixtures/slow-tests.js'
      ]);
    });

    when('runner is completed', () =>
      kutaEmitter.waitForCompletedRun());

    and('a file change is triggered', () =>
      spawn('touch', ['tests/fixtures/slow-tests.js']));

    when('tests are restarting', () =>
      kutaEmitter.waitForOutput());

    and('a file change is triggered again', () =>
      spawn('touch', ['tests/fixtures/slow-tests.js']));

    when('tests are run to completetion', () =>
      kutaEmitter.waitForCompletedRun());

    then('two completed and one aborted test run should have occured', () => {
      const output = kutaEmitter.data();
      const pattern = /Passed/g;
      const matches = [];
      let match;
      while(match = pattern.exec(output)) matches.push(match); // eslint-disable-line
      assert.equal(matches.length, 2);
    });
  });
});
