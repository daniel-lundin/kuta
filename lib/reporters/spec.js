'use strict';

const utils = require('../utils');

const specHelpers = require('./specHelpers');

function createStringLogger() {
  let str = '';
  return {
    log(arg) { str += arg + '\n'; },
    getLog() { return str; }
  };
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
      }
    };
  }

  return function({ testResult, partial = false }) {
    if (partial)
      return;

    const summarizedResults = utils.summarizeResults(testResult.results);

    if (summarizedResults.errors !== 0 ||
        summarizedResults.sucessess !== 0) {
      specHelpers.printResults(logger, testResult.results);
    }
  };
}

module.exports = createSpecReporter;
