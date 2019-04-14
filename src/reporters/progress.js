"use strict";

const colors = require("colors");

const utils = require("../utils");

function cursorUp(lines) {
  process.stdout.write("\u001b[" + lines + "A");
}

function clearComingLines(logger, lines) {
  Array.from({ length: lines }).forEach(() => {
    logger.log("");
    process.stdout.write("\u001b[2K");
  });
  cursorUp(lines);
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

function createProgressReporter(logger, fileCount) {
  const startTime = Date.now();
  const width = Math.min(fileCount, 40);

  let filesProcessed = 0;
  const testResults = [];

  function printFailing(testResult) {
    const failingTests = utils.extractFailingTests(testResult.results);
    if (failingTests.length > 0) {
      failingTests.forEach(failingTest => {
        logger.log(colors.red(colors.bold(fullDescription(failingTest))));
        logger.log(colors.red(failingTest.details));
        logger.log("                              ");
      });
    }
  }

  return function({ testResult, partial = false }) {
    if (partial) return;

    filesProcessed++;
    testResults.push(testResult);
    printFailing(testResult);

    clearComingLines(logger, 6);

    const completionRate = filesProcessed / fileCount;
    logger.logNoNL("[");

    Array.from({ length: width }).forEach((_, index) => {
      if ((index + 1) / width <= completionRate) {
        logger.logNoNL("▬");
      } else {
        logger.logNoNL(" ");
      }
    });
    logger.logNoNL("]");

    const summarizedResults = testResults
      .map(result => utils.summarizeResults(result.results))
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
    logger.log(
      colors.bold(`Passed: ${colors.green(summarizedResults.successes)}`)
    );
    logger.log(colors.bold(`Failed: ${colors.red(summarizedResults.errors)}`));
    logger.log("");

    if (filesProcessed === fileCount) {
      const timeElapsed = Math.round((Date.now() - startTime) / 1000);
      logger.log(colors.bold(`Tests took: ${timeElapsed} s`));
      logger.log("");
      logger.log(colors.bold(colors.rainbow("kthxbai!")));
      logger.log("");
    } else {
      cursorUp(5);
    }
  };
}

module.exports = createProgressReporter;
