"use strict";

const colors = require("colors");

const common = require("../common");
const utils = require("../utils");

const CHECKMARK = "✓";
const XMARK = "✗";

const spaces = length => Array.from({ length: length * 2 }).join(" ");

function header(logger, group, level) {
  const time = ""; //group.time ? `(${group.time} ms)` : '';
  const label = `${spaces(level)} ${colors.bold(group.description)} ${time}`;
  decorateTopLevel(logger, label, level);
}

function decorateTopLevel(logger, label, level) {
  if (level !== 0) return logger.log(label);
  logger.log("\n●" + label);
}

function isGroupEmpty(group) {
  const groupSummary = utils.summarizeResults(group);
  return groupSummary.errors === 0 && groupSummary.successes === 0;
}

function printResults(logger, group, level = 0) {
  if (isGroupEmpty(group)) {
    return;
  }

  header(logger, group, level);

  group.results.forEach(result => {
    if (result.result === common.TEST_SUCCESS) {
      logger.log(
        `${spaces(level + 1)} ${colors.green(CHECKMARK)} ${result.description}`
      );
    } else if (result.result === common.TEST_FAILURE) {
      logger.log(
        `${spaces(level + 1)} ${colors.red(XMARK)} ${result.description}`
      );
      logger.log(colors.red(result.details));
    }
  });

  group.groups.forEach(group => printResults(logger, group, level + 1));
}
module.exports = {
  printResults
};
