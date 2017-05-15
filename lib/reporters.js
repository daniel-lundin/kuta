'use strict';

const colors = require('colors');

const common = require('./common');
const utils = require('./utils');

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


  return function(testResult) {
    const groupLevel = 0;
    const summarizedResults = utils.summarizeResults(testResult.results);

    if (summarizedResults.errors !== 0 ||
        summarizedResults.sucessess !== 0) {
      printResults(testResult.results, groupLevel);
    }
  };
}

function createProgressReporter(logger, fileCount) {
  const width = Math.min(fileCount, 40);
  const placeHolder = Array
    .from({ length: width })
    .map(() => ' ')
    .join('');
  logger.logNoNL(`[${placeHolder}]`);

  let filesProcessed = 0;
  const testResults = [];

  function printFailing() {
    logger.log('');
    logger.log('');
    testResults.forEach((testResult) => {
      const failingTests = utils.extractFailingTests(testResult.results);
      if (failingTests.length > 0) {
        logger.log('');
        logger.log(colors.bold(`● ${testResult.testFile}`));
        failingTests.forEach((failingTest) => {
          logger.log(colors.red(colors.bold(failingTest.description)));
          logger.log(colors.red(failingTest.details));
        });
      }
    });
    logger.log('');
  }

  return function(testResult) {
    filesProcessed++;
    testResults.push(testResult);

    // Delete to beginning of line
    process.stdout.write('\u001b[2K');
    process.stdout.write('\u001b[0G');

    const completionRate = filesProcessed / fileCount;
    logger.logNoNL('[');

    Array.from({ length: width }).forEach((_, index) => {
      if (index / width < completionRate) {
        logger.logNoNL('▬');
      } else {
        logger.logNoNL(' ');
      }
    });
    logger.logNoNL(']');


    if (filesProcessed === fileCount) {
      printFailing();
    }
  };
}

function create(name, logger, fileCount) {
  if (name === 'progress') {
    return createProgressReporter(logger, fileCount);
  }
  return createSpecReporter(logger, fileCount);
}

module.exports = {
  create,
  createSpecReporter,
  createProgressReporter
};
