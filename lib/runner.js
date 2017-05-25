'use strict';

const childProcess = require('child_process');
const path = require('path');
const colors = require('colors');

const utils = require('./utils');
const common = require('./common');
const reporters = require('./reporters');

const EXIT_CODE_FATAL = 10;

function executeInProcessPool(files, matches, requires, processCount, reporterName, timeout, logger) {
  const opts = {
    cwd: process.cwd()
  };

  const processes = Array
    .from({ length: processCount })
    .map((_, index) => {
      const options = Object.assign({}, opts, {
        env: Object.assign({}, process.env, {
          'KUTA_PROCESS_INDEX': index
        })
      });
      return childProcess.fork(path.join(__dirname, './worker.js'), requires, options);
    });

  const testResults = [];
  const reporter = reporters.create(reporterName, logger, files.length);

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
    testResults.push(utils.summarizeResults(message.results));
    if (!startSuiteInProcess(process)) {
      process.kill();
      resolve();
    }
  }

  function onSuiteError(message) {
    logger.log(colors.bold('FATAL ERROR:'));
    logger.log(colors.bold(colors.red(message.testFile)));
    logger.log(colors.red(message.stack));
    logger.log('exiting with', EXIT_CODE_FATAL);
    process.exit(EXIT_CODE_FATAL);
  }

  const processPromises = processes.map((process) => {
    if (!startSuiteInProcess(process)) {
      process.kill();
      return Promise.resolve();
    }

    return new Promise((resolve) => {

      process.on('message', message => {
        switch(message.type) {
        case common.logger:
          return logger.log(message.message);
        case common.TEST_RESULTS:
          return onTestResults(message, process, resolve);
        case common.PARTIAL_TEST_RESULTS:
          return onPartialTestResults(message);
        case common.SUITE_ERROR:
          return onSuiteError(message, process, resolve);
        default:
          logger.log('Unhandled message', message);
        }
      });
    });
  });

  return Promise
    .all(processPromises)
    .then(() => testResults);
}


function run(files, matches, requires, processCount, reporter, timeout, logger) {
  logger.hideCursor();
  return executeInProcessPool(files, matches, requires, processCount, reporter, timeout, logger)
    .then((results) => {
      logger.showCursor();
      return results;
    })
    .then((results) =>
      results.reduce((acc, curr) => ({
        errors: acc.errors + curr.errors,
        successes: acc.successes + curr.successes
      }), { errors: 0, successes: 0 })
    );
}

module.exports = {
  run
};
