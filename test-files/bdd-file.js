const feature = require('../lib/bdd.js');
const assert = require('assert');


feature('a feature', (scenario) => {
  scenario.before(() => {
    console.log('feature before');
  });

  scenario('first scenario', ({ before, after, given, when, then }) => {

    before(() => {
      console.log('before first one');
    });

    after(() => {
      console.log('after first one');
    });

    given('a given', () => {
      assert(true);
    });

    when('something happens', () => {
      assert(true);
    });

    then('something is expected', () => {
      assert(true);
    });
  });

  scenario('second scenario', ({ before, after, then }) => {

    before(() => {
      console.log('before second one');
    });

    after(() => {
      console.log('after second one');
    });

    then('test in second scenario', () => {
      console.log('second something');
    });
  });
});
