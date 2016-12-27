const test = require('./kuta').test;
const colors = require('colors');

function label(keyword) {
  return `${colors.bold(keyword[0].toUpperCase() + keyword.slice(1))}:`;
}

function assignBdd(t) {
  const keywords = ['given', 'when', 'then', 'and'];
  keywords.forEach((keyword) => {
    t[keyword] = function(description, implementation) {
      t(`${label(keyword)} ${description}`, implementation);
    };
  });
}

module.exports = function feature(featureName, featureCallback) {
  test.group(`${label('feature')} ${featureName}`, (t) => {
    function scenario(scenarioName, scenarioCb) {
      t.group(`${label('scenario')} ${scenarioName}`, (t) => {
        assignBdd(t);
        scenarioCb(t);
      });
    }

    // Assign all hooks from group to scenarioHook
    Object.keys(t).forEach((featureHook) => {
      scenario[featureHook] = t[featureHook];
    });

    featureCallback(scenario);
  });
};
