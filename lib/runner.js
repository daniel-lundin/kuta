'use strict';

const fork = require('child_process').fork;
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

function run(files, requires) {
  const children = files.map(file => {
    const opts = {
      cwd: process.cwd()
    };
    const child = fork(path.join(__dirname, './worker.js'), requires, opts);
    child.send(common.startSuite(file));
    return child;
  });

  const testPromises = children.map((child) => {
    return new Promise((resolve, reject) => {
      child.on('close', () => {
        reject('Process closed');
      });

      child.on('message', message => {
        switch(message.type) {
        case common.LOG:
          return handleLog(message);
        case common.TEST_RESULTS:
          return resolve(handleTestResults(message));
        default:
          log('Unhandled message', message);
        }
      });
    });
  });

  return Promise.all(testPromises)
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
