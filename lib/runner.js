'use strict';

const childProcess = require('child_process');
const path = require('path');
const colors = require('colors');

const common = require('./common');


const CHECKMARK = '✓';
const XMARK = '✗';

function log(...args) {
  console.log(...args); // eslint-disable-line
}

function handleLog(message) {
  log('log', message);
}


function handleTestResults(message) {
  const errors = message.tests.filter(test => test.result === common.TEST_FAILTURE);
  const successes = message.tests.filter(test => test.result === common.TEST_SUCCESS);

  log(message.testFile);
  successes.forEach((success) => {
    log(`  ${colors.green(CHECKMARK)} ${success.description}`);
  });

  errors.forEach((error) => {
    log(`  ${colors.red(XMARK)} ${error.description}`);
    log(colors.red(error.details));
  });

  return {
    errors: errors.length,
    successes: successes.length
  };
}

function startProcessPool(files, requires, processCount) {
  const opts = {
    cwd: process.cwd()
  };

  const processes = Array
    .from({ length: processCount})
    .map(() => childProcess.fork(path.join(__dirname, './worker.js'), requires, opts));

  const testResults = [];

  function popFile() {
    return files.shift();
  }

  function startSuiteInProcess(process) {
    const file = popFile();
    if (!file) return false;
    process.send(common.startSuite(file));
    return true;
  }


  const processPromises = processes.map((process) => {
    if (!startSuiteInProcess(process)) {
      process.kill();
      return Promise.resolve();
    }

    return new Promise((resolve) => {

      process.on('message', message => {
        switch(message.type) {
        case common.LOG:
          return handleLog(message);
        case common.TEST_RESULTS:
          {
            testResults.push(handleTestResults(message));
            if (!startSuiteInProcess(process)) {
              process.kill();
              return resolve();
            }
            break;
          }
        default:
          log('Unhandled message', message);
        }
      });
    });
  });

  return Promise
    .all(processPromises)
    .then(() => testResults);
}


function run(files, requires, processCount) {
  return startProcessPool(files, requires, processCount)
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
