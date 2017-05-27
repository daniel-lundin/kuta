'use strict';

const colors = require('colors');
const ora = require('ora');

const utils = require('../utils');

function cursorUp(lines) {
  process.stdout.write('\u001b[' + lines + 'A');
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

  return function({ testResult, partial = false }) {
    if (partial)
      return;

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

module.exports = createProgressReporter;
