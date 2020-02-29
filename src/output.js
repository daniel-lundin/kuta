const colors = require("colors");
const { extractFailingTests, summarizeResults } = require("./utils");

function printSummarizedResult(testResults, logger) {
  const summarizedResults = testResults
    .map(result => summarizeResults(result.results))
    .reduce(
      (acc, curr) =>
        Object.assign(
          {},
          {
            successes: acc.successes + curr.successes,
            errors: acc.errors + curr.errors
          }
        ),
      { successes: 0, errors: 0 }
    );
  logger.log("");
  logger.log("");
  logger.log(colors.bold(`Passed: ${colors.green(summarizedResults.successes)}`));
  logger.log(colors.bold(`Failed: ${colors.red(summarizedResults.errors)}`));
  logger.log("");
}

function fullDescription(test) {
  let description = test.description;
  let parentGroup = test.parentGroup;
  while (parentGroup) {
    description = `${parentGroup.description} ${description}`;
    parentGroup = parentGroup.parentGroup;
  }
  return description;
}

function printFailingTests(testResult, logger) {
  const failingTests = extractFailingTests(testResult.results);
  if (failingTests.length > 0) {
    failingTests.forEach(failingTest => {
      logger.log(colors.red(colors.bold(fullDescription(failingTest))));
      logger.log(colors.red(failingTest.details));
      logger.log("                              ");
    });
  }
}

module.exports = {
  printSummarizedResult,
  printFailingTests
};
