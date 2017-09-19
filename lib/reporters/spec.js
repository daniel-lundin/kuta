'use strict';

const colors = require('colors');
const utils = require('../utils');

const specHelpers = require('./specHelpers');

function createStringLogger() {
  let str = '';
  return {
    log(arg) { str += arg + '\n'; },
    getLog() { return str; }
  };
}

function printSummarizedResult(logger, testResults, startTime) {
  const summarizedReposts = testResults
    .map((result) => utils.summarizeResults(result.results))
    .reduce((acc, curr) => Object.assign({}, {
      successes: acc.successes + curr.successes,
      errors: acc.errors + curr.errors
    }), { successes: 0, errors: 0 });
  logger.log('');
  logger.log('');
  logger.log(colors.bold(`Passed: ${colors.green(summarizedReposts.successes)}`));
  logger.log(colors.bold(`Failed: ${colors.red(summarizedReposts.errors)}`));
  logger.log('');

  const timeElapsed = Math.round((Date.now() - startTime) / 1000);
  logger.log(colors.bold(`Tests took: ${timeElapsed} s`));
  logger.log('');
  logger.log(colors.bold(colors.rainbow('kthnxbai!')));
  logger.log('');
}

function createSpecReporter(logger, fileCount, processCount) {
  const startTime = Date.now();
  const completedResults = [];
  let filesCompleted = 0;

  if (fileCount === 1 || processCount === 1) {
    // Return the interactive version
    let lastFile = '';
    let lastFileOutput = '';

    return function({ testResult, partial }) {
      if (!partial) {
        filesCompleted++;
        completedResults.push(testResult);
      }

      const { testFile, results } = testResult;

      const summarizedResults = utils.summarizeResults(results);

      if (summarizedResults.errors !== 0 ||
          summarizedResults.sucessess !== 0) {
        const stringLogger = createStringLogger();

        specHelpers.printResults(stringLogger, results);
        const currentOutput = stringLogger.getLog();

        if (!currentOutput) return;

        if (testFile === lastFile) {
          logger.logNoNL(currentOutput.replace(lastFileOutput, ''));
        } else {
          logger.logNoNL(currentOutput);
        }

        lastFileOutput = currentOutput;
        lastFile = testFile;

        if (filesCompleted === fileCount) {
          printSummarizedResult(logger, completedResults, startTime);
        }
      }
    };
  }

  return function({ testResult, partial = false }) {
    if (partial)
      return;
    filesCompleted++;
    completedResults.push(testResult);

    const summarizedResults = utils.summarizeResults(testResult.results);

    if (summarizedResults.errors !== 0 ||
        summarizedResults.sucessess !== 0) {
      specHelpers.printResults(logger, testResult.results);
    }

    if (filesCompleted === fileCount) {
      printSummarizedResult(logger, completedResults, startTime);
    }
  };
}

module.exports = createSpecReporter;
