'use strict';

const colors = require('colors');
const ora = require('ora');

const common = require('./common');
const utils = require('./utils');

function cursorUp(lines) {
  process.stdout.write('\u001b[' + lines + 'A');
}

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

function fullDescription(test) {
  let description = test.description;
  let parentGroup = test.parentGroup;
  while (parentGroup) {
    description = `${parentGroup.description} ${description}`;
    parentGroup = parentGroup.parentGroup;
  }
  return description;
}

function createProgressReporter(logger, fileCount) {
  const width = Math.min(fileCount, 40);
  const placeHolder = Array
    .from({ length: width })
    .map(() => ' ')
    .join('');
  logger.logNoNL(`[${placeHolder}]`);
  logger.log('');
  logger.log('');
  logger.log('');
  logger.log('');
  logger.log('');

  let filesProcessed = 0;
  const testResults = [];

  function printFailing() {
    logger.log('');
    logger.log('');
    testResults.forEach((testResult) => {
      const failingTests = utils.extractFailingTests(testResult.results);
      if (failingTests.length > 0) {
        logger.log('');
        failingTests.forEach((failingTest) => {
          logger.log(colors.red(colors.bold(fullDescription(failingTest))));
          logger.log(colors.red(failingTest.details));
        });
      }
    });
    logger.log('');
  }

  const spinner = ora({ spinner: 'arrow3', text: colors.bold('kutar...') });
  spinner.start();
  return function(testResult) {
    filesProcessed++;
    testResults.push(testResult);

    // Delete to beginning of line
    cursorUp(5);
    process.stdout.write('\u001b[2K');
    process.stdout.write('\u001b[0G');

    const completionRate = filesProcessed / fileCount;
    logger.logNoNL('[');

    Array.from({ length: width }).forEach((_, index) => {
      if ((index + 1) / width <= completionRate) {
        logger.logNoNL('▬');
      } else {
        logger.logNoNL(' ');
      }
    });
    logger.logNoNL(']');

    const summarizeResults = testResults
      .map((result) => utils.summarizeResults(result.results))
      .reduce((acc, curr) => Object.assign({}, {
        successes: acc.successes + curr.successes,
        errors: acc.errors + curr.errors
      }), { successes: 0, errors: 0 });
    logger.log('');
    logger.log('');
    logger.log(colors.bold(`Passed: ${colors.green(summarizeResults.successes)}`));
    logger.log(colors.bold(`Failed: ${colors.red(summarizeResults.errors)}`));
    logger.log('');

    // spinner.start();

    if (filesProcessed === fileCount) {
      cursorUp(6);
      printFailing();
      spinner.stop();
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
