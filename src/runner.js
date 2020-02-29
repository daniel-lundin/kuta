"use strict";

const colors = require("colors");

const common = require("./common");
const reporters = require("./reporters");
const { startProcessPool } = require("./process-pool");

const EXIT_CODE_FATAL = 10;

function executeInProcessPool(
  files,
  logger,
  {
    matches,
    requires,
    processCount,
    reporterName,
    timeout,
    verbose = false,
    printErrorSummary
  } = {}
) {
  const processes = startProcessPool(processCount, requires);

  const testResults = [];
  const reporter = reporters.create({
    name: reporterName,
    logger,
    fileCount: files.length,
    processCount,
    verbose,
    printErrorSummary
  });

  function popFile() {
    return files.shift();
  }

  function startSuiteInProcess(process) {
    const file = popFile();
    if (!file) return false;
    process.send(common.startSuite(file, matches[file] || [], timeout));
    return true;
  }

  function onPartialTestResults(message) {
    reporter({ testResult: message, partial: true });
  }

  function onTestResults(message, process, resolve) {
    reporter({ testResult: message });
    testResults.push(message.results);
    if (!startSuiteInProcess(process)) {
      process.removeAllListeners("message");
      process.removeAllListeners("exit");
      resolve();
    }
  }

  function onSuiteError(message) {
    logger.log(colors.bold("FATAL ERROR:"));
    logger.log(colors.bold(colors.red(message.testFile)));
    logger.log(colors.red(message.stack));
    logger.log("exiting with", EXIT_CODE_FATAL);
    process.exit(EXIT_CODE_FATAL);
  }

  const processPromises = processes.map(process => {
    if (!startSuiteInProcess(process)) {
      process.removeAllListeners("message");
      process.removeAllListeners("exit");

      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      process.on("message", message => {
        switch (message.type) {
          case common.logger:
            return logger.log(message.message);
          case common.TEST_RESULTS:
            return onTestResults(message, process, resolve);
          case common.PARTIAL_TEST_RESULTS:
            return onPartialTestResults(message);
          case common.SUITE_ERROR:
            return onSuiteError(message, process, resolve);
          default:
            logger.log("Unhandled message", message);
        }
      });

      process.on("exit", code => {
        if (code === common.ABORT_EXIT_CODE) {
          reject(`foooo ${common.ABORT_EXIT_CODE}`);
        }
      });
    });
  });

  return Promise.all(processPromises).then(() => testResults);
}

function run(files, logger, options) {
  logger.hideCursor();
  return executeInProcessPool(files, logger, options).then(results => {
    logger.showCursor();
    return results;
  });
}

module.exports = {
  run
};
