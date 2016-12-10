'use strict';

const fork = require('child_process').fork;

const common = require('./common');

function handleLog(message) {
  console.log('log', message);
}


function handleTestResults(message) {
  const errors = message.tests.filter(test => test.result === common.TEST_FAILTURE);
  const successes = message.tests.filter(test => test.result === common.TEST_SUCCESS);

  successes.forEach((success) => {
    const emoji = '✅';
    console.log(`${emoji}  - ${success.description}`);
  });

  errors.forEach((error) => {
    const emoji = '🚫';
    console.log(`${emoji}  -  ${error.description}`);
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
          console.log('Unhandled message', m);
        }
      });
    });
  });

  return Promise.all(testPromises);
}

module.exports = {
  run
};
