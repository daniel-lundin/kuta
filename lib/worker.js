const test = require("./kuta");
const common = require("./common");
const logger = require("./logger");
const path = require("path");

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
    default:
      logger.log("Child - unknown command", message);
      process.send(common.log("Unknown command"));
  }
});

const requires = process.argv.slice(2);
requires.forEach(file => {
  try {
    require(file);
  } catch (e) {
    require(path.join(process.cwd(), file));
  }
});
