'use strict';

const common = require('./common');

function arrayParam(longArg, shortArg) {
  return [].concat(longArg || []).concat([].concat(shortArg || []));
}

function summarizeResults(group) {
  const errors = group.results.filter(test => test.result === common.TEST_FAILURE);
  const successes = group.results.filter(test => test.result === common.TEST_SUCCESS);

  return group.groups.reduce((acc, group) => {
    const groupResult = summarizeResults(group);
    return {
      errors: acc.errors + groupResult.errors,
      successes: acc.successes + groupResult.successes
    };
  }, { errors: errors.length, successes: successes.length });
}

function extractFailingTests(group) {
  const errors = group.results.filter(test => test.result === common.TEST_FAILURE);
  return errors.concat(
    ...group.groups.map((group) => extractFailingTests(group))
  );
}

module.exports = {
  arrayParam,
  summarizeResults,
  extractFailingTests
};

