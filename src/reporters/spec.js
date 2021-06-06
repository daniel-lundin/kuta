"use strict";

const colors = require("colors");
const utils = require("../utils");

const specHelpers = require("./specHelpers");

function createStringLogger() {
  let str = "";
  return {
    log(arg) {
      str += arg + "\n";
    },
    getLog() {
      return str;
    }
  };
}

function printSummarizedResult(logger, testResults, startTime, printErrorSummary) {
  const summarizedReposts = testResults
    .map(result => utils.summarizeResults(result.results))
    .reduce(
      (acc, curr) =>
        Object.assign(
          {},
          {
            successes: acc.successes + curr.successes,
            errors: acc.errors + curr.errors,
            errorDetails: [...acc.errorDetails, ...curr.errorDetails]
          }
        ),
      { successes: 0, errors: 0, errorDetails: [] }
    );
  logger.log("");
  logger.log("");
  logger.log(
    colors.bold(`Passed: ${colors.green(summarizedReposts.successes)}`)
  );
  logger.log(colors.bold(`Failed: ${colors.red(summarizedReposts.errors)}`));
  logger.log("");

  if(printErrorSummary && summarizedReposts.errorDetails.length > 0) {
    logger.log("Failing tests:");
    summarizedReposts.errorDetails.forEach(error => {
      logger.log(colors.red(`✗ ${error.description}`));
      logger.log(`${error.details}`);
      logger.log("");
    });
    logger.log("");
  }

  const timeElapsed = Math.round((Date.now() - startTime) / 1000);
  logger.log(colors.bold(`Tests took: ${timeElapsed} s`));
  logger.log("");
  logger.log(colors.bold(colors.rainbow("kthnxbai!")));
  logger.log("");
}

function createSpecReporter(logger, fileCount, processCount, printErrorDetails) {
  const startTime = Date.now();
  const completedResults = [];
  let filesCompleted = 0;

  if (fileCount === 1 || processCount === 1) {
    // Return the interactive version
    let lastFile = "";
    let lastFileOutput = "";

    return function({ testResult, partial }) {
      if (!partial) {
        filesCompleted++;
        completedResults.push(testResult);
      }

      const { testFile, results } = testResult;

      const summarizedResults = utils.summarizeResults(results);

      if (summarizedResults.errors !== 0 || summarizedResults.sucessess !== 0) {
        const stringLogger = createStringLogger();

        specHelpers.printResults(stringLogger, results, 0, false);
        const currentOutput = stringLogger.getLog();

        if (!currentOutput) return;

        if (testFile === lastFile) {
          logger.logNoNL(currentOutput.replace(lastFileOutput, ""));
        } else {
          logger.logNoNL(currentOutput);
        }

        lastFileOutput = currentOutput;
        lastFile = testFile;

        if (filesCompleted === fileCount) {
          printSummarizedResult(logger, completedResults, startTime, printErrorDetails);
        }
      }
    };
  }

  return function({ testResult, partial = false }) {
    if (partial) return;
    filesCompleted++;
    completedResults.push(testResult);

    const summarizedResults = utils.summarizeResults(testResult.results);

    if (summarizedResults.errors !== 0 || summarizedResults.sucessess !== 0) {
      specHelpers.printResults(logger, testResult.results);
    }

    if (filesCompleted === fileCount) {
      printSummarizedResult(logger, completedResults, startTime);
    }
  };
}

module.exports = createSpecReporter;
