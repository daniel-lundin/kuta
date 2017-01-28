const test = require('./kuta');
const common = require('./common');
const logger = require('./logger');
const path = require('path');


function startSuite(testFile, timeout) {
  test.runTests(testFile, timeout)
    .then((results) => process.send(common.reportResult(testFile, results)))
    .catch((err) => {
      process.send(common.suiteError(testFile, err.stack));
    });
}

process.on('message', message => {
  switch(message.type) {
  case common.START_TEST_SUITE: {
    startSuite(message.testFile, message.timeout);
    break;
  }
  default:
    logger.log('Child - unknown command', message);
    process.send(common.log('Unknown command'));
  }
});

const requires = process.argv.slice(2);
requires.forEach((file) => {
  try { 
    require(file);
  }
  catch(e) {
    require(path.join(process.cwd(), file));
  }
});

module.exports = {
  startSuite
};
