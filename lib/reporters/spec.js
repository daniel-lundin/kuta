'use strict';

const colors = require('colors');

const common = require('../common');
const utils = require('../utils');

function createSpecReporter(logger) {
  const CHECKMARK = '✓';
  const XMARK = '✗';

  const spaces = (length) => Array.from({ length: length * 2 }).join(' ');

  function decorateTopLevel(label, level) {
    if (level !== 0)
      return logger.log(label);
    logger.log('\n●' + label);
  }

  function header(group, level) {
    const time = group.time ? `(${group.time} ms)` : '';
    const label = `${spaces(level)} ${colors.bold(group.description)} ${time}`;
    decorateTopLevel(label, level);
  }

  function isGroupEmpty(group) {
    const groupSummary = utils.summarizeResults(group);
    return groupSummary.errors === 0 && groupSummary.successes === 0;
  }

  function printResults(group, level) {
    if (isGroupEmpty(group)) {
      return;
    }

    header(group, level);

    group.results.forEach((result) => {
      if (result.result === common.TEST_SUCCESS) {
        logger.log(`${spaces(level + 1)} ${colors.green(CHECKMARK)} ${result.description}`);
      } else if (result.result === common.TEST_FAILURE){
        logger.log(`${spaces(level + 1)} ${colors.red(XMARK)} ${result.description}`);
        logger.log(colors.red(result.details));
      }
    });

    group.groups.forEach((group) => printResults(group, level + 1));
  }


  return function({ testResult, partial = false }) {
    if (partial)
      return;

    const groupLevel = 0;
    const summarizedResults = utils.summarizeResults(testResult.results);

    if (summarizedResults.errors !== 0 ||
        summarizedResults.sucessess !== 0) {
      printResults(testResult.results, groupLevel);
    }
  };
}

module.exports = createSpecReporter;
