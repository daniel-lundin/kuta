const test = require("./kuta");
const common = require("./common");
const logger = require("./logger");

const IPC = {
  send(message) {
    process.send(message);
  }
};

process.on("message", message => {
  switch (message.type) {
    case common.START_TEST_SUITE:
      test.runTests(message.testFile, message.match, message.timeout, IPC);
      break;
    case common.ABORT_SUITE:
      process.exit(common.ABORT_EXIT_CODE);
      break;
    case common.STOP_TESTS:
      test.stopTests();
      break;
    default:
      logger.log("Child - unknown command", message);
      process.send(common.log("Unknown command"));
  }
});
