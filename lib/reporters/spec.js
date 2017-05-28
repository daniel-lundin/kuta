'use strict';

const colors = require('colors');

const common = require('../common');
const utils = require('../utils');

const CHECKMARK = '✓';
const XMARK = '✗';

const spaces = (length) => Array.from({ length: length * 2 }).join(' ');

function createStringLogger() {
  let str = '';
  return {
    log(arg) { str += arg + '\n'; },
    getLog() { return str; }
  };
}

function isGroupEmpty(group) {
  const groupSummary = utils.summarizeResults(group);
  return groupSummary.errors === 0 && groupSummary.successes === 0;
}

function decorateTopLevel(logger, label, level) {
  if (level !== 0)
    return logger.log(label);
  logger.log('\n●' + label);
}

function header(logger, group, level) {
  const time = ''; //group.time ? `(${group.time} ms)` : '';
  const label = `${spaces(level)} ${colors.bold(group.description)} ${time}`;
  decorateTopLevel(logger, label, level);
}

function printResults(logger, group, level = 0) {
  if (isGroupEmpty(group)) {
    return;
  }

  header(logger, group, level);

  group.results.forEach((result) => {
    if (result.result === common.TEST_SUCCESS) {
      logger.log(`${spaces(level + 1)} ${colors.green(CHECKMARK)} ${result.description}`);
    } else if (result.result === common.TEST_FAILURE){
      logger.log(`${spaces(level + 1)} ${colors.red(XMARK)} ${result.description}`);
      logger.log(colors.red(result.details));
    }
  });

  group.groups.forEach((group) => printResults(logger, group, level + 1));
}

function createSpecReporter(logger, fileCount, processCount) {

  if (fileCount === 1 || processCount === 1) {
    // Return the interactive version
    let lastFile = '';
    let lastFileOutput = '';

    return function({ testResult: { testFile, results } }) {
      const summarizedResults = utils.summarizeResults(results);

      if (summarizedResults.errors !== 0 ||
          summarizedResults.sucessess !== 0) {
        const stringLogger = createStringLogger();

        printResults(stringLogger, results);
        const currentOutput = stringLogger.getLog();

        if (!currentOutput) return;
        // console.log('currentOutput', currentOutput);
        // console.log('lastOutput', lastFileOutput);

        if (testFile === lastFile) {
          logger.logNoNL(currentOutput.replace(lastFileOutput, ''));
        } else {
          // console.log('testFile, lastFile', testFile, lastFile);
          logger.logNoNL(currentOutput);
        }

        lastFileOutput = currentOutput;
        lastFile = testFile;
      }
    };
  }

  return function({ testResult, partial = false }) {
    if (partial)
      return;

    const summarizedResults = utils.summarizeResults(testResult.results);

    if (summarizedResults.errors !== 0 ||
        summarizedResults.sucessess !== 0) {
      printResults(logger, testResult.results);
    }
  };
}

module.exports = createSpecReporter;
