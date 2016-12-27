const test = require('./kuta');
const common = require('./common');


function startSuite(testFile) {
  test.runTests(testFile)
    .then((results) => process.send(common.reportResult(testFile, results)))
    .catch((err) => {
      const error = {
        message: err.message,
        stack: err.stack
      };
      process.send(common.log('runTests got error', error));
    });
}

process.on('message', message => {
  switch(message.type) {
  case common.START_TEST_SUITE: {
    startSuite(message.testFile);
    break;
  }
  default:
    console.log('Child - unknown command', message); // eslint-disable-line
    process.send(common.log('Unknown command'));
  }
});

const requires = process.argv.slice(2);
requires.forEach(require);

module.exports = {
  startSuite
};
