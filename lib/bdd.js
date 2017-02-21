const test = require('./kuta').test;
const colors = require('colors');

function label(keyword) {
  return `${colors.bold(keyword[0].toUpperCase() + keyword.slice(1))}`;
}

function assignBdd(t) {
  const keywords = ['given', 'when', 'then', 'and', 'but'];
  keywords.forEach((keyword) => {
    t[keyword] = function(description, implementation) {
      t(`${label(keyword)} ${description}`, implementation);
    };
  });
}

function feature(featureName, featureCallback) {
  test.group(`${label('feature')}: ${featureName}`, (t) => {
    function scenario(scenarioName, scenarioCb) {
      t.group(`${label('scenario')}: ${scenarioName}`, (t) => {
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
}

function describe(description, callback) {

  function chainer(t) {
    t.describe = (description, callback) => {
      t.group(description, (t) => {
        callback(chainer(t));
      });
    };

    return t;
  }

  test.group(description, (t) => {
    callback(chainer(t));
  });
}

module.exports = {
  feature,
  describe
};
