const assert = require('assert');

const feature = require('../../lib/bdd').feature;
const { kutaAsEmitter } = require('../helpers/spawn');


feature('.only running', (scenario) => {
  scenario('run tests in groups that have only', ({ after, given, when, then }) => {
    let kutaProcessEmitter;

    after(() => {
      kutaProcessEmitter && kutaProcessEmitter.kill();
    });

    given('a kuta process', () => {
      kutaProcessEmitter = kutaAsEmitter(['test-files/file-with-onlys.js']);
    });

    when('kuta process completed', () => {
      return kutaProcessEmitter.waitForCompletedRun();
    });

    then('five tests should have run', () => {
      assert.equal(kutaProcessEmitter.passes(), 6);
      assert.equal(kutaProcessEmitter.failures(), 0);
    });
  });
});

feature('skip .skip', (scenario) => {
  scenario('not run skipped tests', ({ after, given, when, then }) => {
    let kutaProcessEmitter;

    after(() => {
      kutaProcessEmitter && kutaProcessEmitter.kill();
    });

    given('a kuta process', () => {
      kutaProcessEmitter = kutaAsEmitter(['test-files/skipped-tests.js']);
    });

    when('kuta process completed', () => {
      return kutaProcessEmitter.waitForCompletedRun();
    });

    then('two tests should have run', () => {
      assert.equal(kutaProcessEmitter.passes(), 2);
      assert.equal(kutaProcessEmitter.failures(), 0);
    });
  });
});


