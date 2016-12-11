const test = require('./kuta');
const common = require('./common');
const path = require('path');

function startSuite(file) {
  require(path.join('../', file));

  test.runTests()
    .then((tests) => process.send(common.reportResult(tests)))
    .then(() => process.exit());
}

process.on('message', message => {
  switch(message.type) {
  case common.START_TEST_SUITE: {
    startSuite(message.testFile);
    break;
  }
  default:
    console.log('Child - unknown command', message);
    process.send(common.log('Unknown command'));
  }
});
