"use strict";

const createSpecReporter = require("./spec");
const createProgressReporter = require("./progress");
const createFutureReporter = require("./future");
const createDotReporter = require("./dot");

function create({ name, logger, fileCount, processCount, printErrorSummary }) {
  switch (name) {
    case "progress":
      return createProgressReporter(logger, fileCount, processCount);
    case "future":
      return createFutureReporter(logger, fileCount, processCount);
    case "dot":
      return createDotReporter(logger, fileCount, processCount);
    default:
      return createSpecReporter(logger, fileCount, processCount, printErrorSummary);
  }
}

module.exports = {
  create
};
