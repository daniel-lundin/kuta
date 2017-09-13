const assert = require('assert');

const feature = require('../../lib/bdd').feature;
const { promisedSpawn, kutaAsEmitter } = require('../helpers/spawn');

feature('file watch', (scenario) => {
  scenario('trigger new run on file change', ({ after, given, when, then, and }) => {
    let kutaEmitter;

    after(() => kutaEmitter.kill());

    given('a started test runner in watch mode', () => {
      kutaEmitter = kutaAsEmitter([
        '-w',
        'test-files/passing-tests.js',
        'test-files/passing-tests.js'
      ]);
    });

    when('test run completes', () =>
      kutaEmitter.waitForCompletedRun());

    and('a file change is triggered', () =>
      promisedSpawn('touch', ['test-files/passing-tests.js']));

    then('tests should run again', () =>
      kutaEmitter.waitForCompletedRun());
  });

  scenario('should not exit on failures in watch mode', ({ after, given, when, then }) => {
    let kutaProcessEmitter;

    after(() => {
      kutaProcessEmitter && kutaProcessEmitter.kill();
    });

    given('a started kuta process', () => {
      kutaProcessEmitter = kutaAsEmitter(['-w', 'test-files', 'test-files/failing-tests.js']);
    });

    when('some time flies', () => {
      return kutaProcessEmitter.waitForCompletedRun();
    });

    when('a file is changed', () =>
      promisedSpawn('touch', ['test-files/failing-tests.js']));

    when('some more time flies', () => {
      return kutaProcessEmitter.waitForCompletedRun();
    });

    then('process should not be killed', () => {
      assert.equal(kutaProcessEmitter.isClosed(), false);
    });
  });

  // scenario('cancel current run on file change', ({ before, after, given, when, and, then }) => {
  //   let clock;
  //   let fsWatchCallback;
  //   let startTestsResolver;

  //   before(() => {
  //     sinon.stub(fs, 'watch', (dir, opts, callback) => { fsWatchCallback = callback; });
  //     sinon.stub(logger, 'log');
  //     sinon.stub(cli, 'startTests').returns(new Promise((resolve) => {
  //       startTestsResolver = resolve;
  //     }));
  //     clock = sinon.useFakeTimers();
  //   });

  //   after(() => {
  //     fs.watch.restore();
  //     cli.startTests.restore();
  //     clock.restore();
  //     logger.log.restore();
  //   });

  //   given('a directory watch', () => {
  //     cli.startWatch(['some dir']);
  //   });

  //   when('a test run is started', () => {
  //     cli.runTests();
  //   });

  //   and('a file change is triggered', () => {
  //     fsWatchCallback();
  //     clock.tick(1000);
  //   });

  //   then('test should restart', () => {
  //     assert(cli.startTests.calledTwice, 'Only one test run should have been triggered');
  //   });

  //   when('test run completes', () => {
  //     startTestsResolver();
  //   });

  //   then('tests should run again', () => {
  //     assert(cli.startTests.calledTwice, 'startTests should have been twice');
  //   });
  // });

});
