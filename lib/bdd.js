const test = require('./kuta').test;

function assignBdd(t) {
  const keywords = ['given', 'when', 'then', 'and'];
  keywords.forEach((keyword) => {
    t[keyword] = function(description, implementation) {
      t(description, implementation);
    };
  });
}



module.exports = function feature(featureName, featureCallback) {

  test.group(featureName, (t) => {

    function scenario(scenarioName, scenarioCb) {
      test.group(scenarioName, (t) => {
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
