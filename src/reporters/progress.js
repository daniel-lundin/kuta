"use strict";

const colors = require("colors");

const { printFailingTests, printSummarizedResult } = require("../output");

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

function createProgressReporter(logger, fileCount) {
  const startTime = Date.now();
  const width = Math.min(fileCount, 40);

  let filesProcessed = 0;
  const testResults = [];

  return function({ testResult, partial = false }) {
    if (partial) return;

    filesProcessed++;
    testResults.push(testResult);
    printFailingTests(testResult, logger);

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

    printSummarizedResult(testResults, logger);

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
