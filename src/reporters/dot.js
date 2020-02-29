const { printFailingTests } = require("../output");
const colors = require("colors");

function createDotReporter(logger, fileCount) {
  const startTime = Date.now();
  let filesProcessed = 0;
  const testResults = [];
  return function({ testResult, partial = false }) {
    if (partial) return;
    filesProcessed++;
    testResults.push(testResult);

    logger.logNoNL(".");
    printFailingTests(testResult, logger);

    if (fileCount === filesProcessed) {
      logger.log("");
      testResults.forEach(result => printFailingTests(result, logger));
      const timeElapsed = Math.round((Date.now() - startTime) / 1000);
      logger.log(colors.bold(`Tests took: ${timeElapsed} s`));
      logger.log("");
      logger.log(colors.bold(colors.rainbow("kthxbai!")));
      logger.log("");
    }
  };
}

module.exports = createDotReporter;
