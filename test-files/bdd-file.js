const feature = require('../lib/bdd.js');
const assert = require('assert');


feature('a feature', (scenario) => {
  scenario.before(() => {
    console.log('feature before');
  });

  scenario('a scenario', ({ given, when, then }) => {
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
});
