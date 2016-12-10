const test = require('./kuta');
const common = require('./common');
const path = require('path');

function startSuite(file) {
  require(path.join('../', file));

  const tests = test.runTests();
  process.send(common.reportResult(tests));
  process.exit();
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
