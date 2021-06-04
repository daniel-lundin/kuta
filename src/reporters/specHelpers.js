"use strict";

const colors = require("colors");

const common = require("../common");
const utils = require("../utils");

const CHECKMARK = "✓";
const XMARK = "✗";

const spaces = length => Array.from({ length: length * 2 }).join(" ");

function header(logger, group, level, includeTime) {
  const time = includeTime && group.time !== null && group.time !== undefined ? `(${group.time} ms)` : "";
  const label = `${spaces(level)} ${colors.bold(group.description)} ${time}`;
  decorateTopLevel(logger, label, level);
}

function footer(logger, group, level) {
  if (group.time !== null && group.time !== undefined) {
    const label = `${spaces(level)} ${colors.bold(group.description)} (${group.time} ms)`;
    logger.log(label);
  }
}

function decorateTopLevel(logger, label, level) {
  if (level !== 0) return logger.log(label);
  logger.log("\n●" + label);
}

function isGroupEmpty(group) {
  const groupSummary = utils.summarizeResults(group);
  return groupSummary.errors === 0 && groupSummary.successes === 0;
}

function printResults(logger, group, level = 0, includeTimeInHeader = true) {
  if (isGroupEmpty(group)) {
    return;
  }

  header(logger, group, level, includeTimeInHeader);

  group.results.forEach(result => {
    const time = result.time || result.time === 0 ? `(${result.time} ms)` : "";
    if (result.result === common.TEST_SUCCESS) {
      logger.log(
        `${spaces(level + 1)} ${colors.green(CHECKMARK)} ${result.description} ${time}`
      );
    } else if (result.result === common.TEST_FAILURE) {
      logger.log(
        `${spaces(level + 1)} ${colors.red(XMARK)} ${result.description} ${time}`
      );
      logger.log(colors.red(result.details));
    }
  });

  group.groups.forEach(group => printResults(logger, group, level + 1, includeTimeInHeader));

  if (!includeTimeInHeader) {
    footer(logger, group, level);
    group.time = null;
  }
}

module.exports = {
  printResults
};
