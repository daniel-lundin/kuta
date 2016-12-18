const test = require('./kuta').test;

function createT(scenarioName, only) {
  const t = {};

  // t.before = (fun) => test.before(fun);
  t.after = (fun) => test.after(fun);

  const keywords = ['before', 'given', 'when', 'then', 'and'];
  const cucumbers = keywords.reduce((acc, curr) => Object.assign(
    acc,
    {
      [curr]: test // (description, callback) => tester(`${scenarioName}: ${description}`, callback)
    }
  ), {});

  Object.assign(t, cucumbers);
  return t;
}

module.exports = function feature(featureName, featureCallback) {
  function scenario(scenarioName, scenarioCallback, only) {
    scenarioCallback(createT(scenarioName, only));
  }

  scenario.only = (scenarioName, scenarioCallback) => {
    scenario(scenarioName, scenarioCallback, true);
  };

  scenario.before = test.before;
  scenario.after = test.after;

  featureCallback(scenario);
};
