'use strict';

const childProcess = require('child_process');
const path = require('path');
const colors = require('colors');

const common = require('./common');
const logger = require('./logger');


const CHECKMARK = '✓';
const XMARK = '✗';

function handleLog(message) {
  logger.log('log', message);
}

const spaces = (length) => Array.from({ length: length * 2 }).join(' ');

function decorateTopLevel(label, level, log) {
  if (level !== 0)
    return log(label);
  log('\n●' + label);
}

function header(group, level, log) {
  const time = group.time ? `(${group.time} ms)` : '';
  const label = `${spaces(level)} ${colors.bold(group.description)} ${time}`;
  decorateTopLevel(label, level, log);
}

function printResults(group, level, log) {
  header(group, level, log);

  group.results.forEach((result) => {
    if (result.result === common.TEST_SUCCESS) {
      log(`${spaces(level + 1)} ${colors.green(CHECKMARK)} ${result.description}`);
    } else {
      log(`${spaces(level + 1)} ${colors.red(XMARK)} ${result.description}`);
      log(colors.red(result.details));
    }
  });

  group.groups.forEach((group) => printResults(group, level + 1, log));
}

function summarizeResults(group) {
  const errors = group.results.filter(test => test.result === common.TEST_FAILURE);
  const successes = group.results.filter(test => test.result === common.TEST_SUCCESS);

  return group.groups.reduce((acc, group) => {
    const groupResult = summarizeResults(group);
    return {
      errors: acc.errors + groupResult.errors,
      successes: acc.successes + groupResult.successes
    };
  }, { errors: errors.length, successes: successes.length });
}

function handleTestResults(message, log) {
  printResults(message.results, 0, log);
  return summarizeResults(message.results);
}

function startProcessPool(files, requires, processCount, timeout, log) {
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
    process.send(common.startSuite(file, timeout));
    return true;
  }

  function onTestResults(message, process, resolve) {
    testResults.push(handleTestResults(message, log));
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
        case common.LOG:
          return handleLog(message.message);
        case common.TEST_RESULTS:
          return onTestResults(message, process, resolve);
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


function run(files, requires, processCount, timeout, log=logger.log) {
  return startProcessPool(files, requires, processCount, timeout, log)
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
