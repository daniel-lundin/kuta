'use strict';

const childProcess = require('child_process');
const path = require('path');

const utils = require('./utils');
const common = require('./common');
const reporters = require('./reporters');

function executeInProcessPool(files, match, requires, processCount, timeout, logger) {
  const opts = {
    cwd: process.cwd()
  };

  const processes = Array
    .from({ length: processCount})
    .map(() => childProcess.fork(path.join(__dirname, './worker.js'), requires, opts));

  const testResults = [];
  const reporter = reporters.createSpecReporter(logger);
  // const reporter = reporters.createProgressReporter(logger, files.length);

  function popFile() {
    return files.shift();
  }

  function startSuiteInProcess(process) {
    const file = popFile();
    if (!file) return false;
    process.send(common.startSuite(file, match, timeout));
    return true;
  }

  function onTestResults(message, process, resolve) {
    reporter(message);
    testResults.push(utils.summarizeResults(message.results));
    if (!startSuiteInProcess(process)) {
      process.kill();
      resolve();
    }
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


function run(files, match, requires, processCount, timeout, logger) {
  logger.hideCursor();
  return executeInProcessPool(files, match, requires, processCount, timeout, logger)
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
