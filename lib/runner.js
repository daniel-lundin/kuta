'use strict';

const fork = require('child_process').fork;

const common = require('./common');

function log(...args) {
  console.log(...args); // eslint-disable-line
}

function handleLog(message) {
  log('log', message);
}


function handleTestResults(message) {
  const errors = message.tests.filter(test => test.result === common.TEST_FAILTURE);
  const successes = message.tests.filter(test => test.result === common.TEST_SUCCESS);

  successes.forEach((success) => {
    const emoji = '✅';
    log(`${emoji}  - ${success.description}`);
  });

  errors.forEach((error) => {
    const emoji = '🚫';
    log(`${emoji}  -  ${error.description}`);
    log(error.details);
  });
}

function run(files) {
  const children = files.map(file => {
    const child = fork('./lib/worker.js');
    child.send(common.startSuite(file));
    return child;
  });

  const testPromises = children.map((child) => {
    return new Promise((resolve) => {
      child.on('close', () => {
        resolve();
      });

      child.on('message', m => {
        switch(m.type) {
        case common.LOG:
          return handleLog(m);
        case common.TEST_RESULTS:
          return handleTestResults(m);
        default:
          log('Unhandled message', m);
        }
      });
    });
  });

  return Promise.all(testPromises);
}

module.exports = {
  run
};
