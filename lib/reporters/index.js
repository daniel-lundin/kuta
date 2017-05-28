'use strict';

const createSpecReporter = require('./spec');
const createProgressReporter = require('./progress');

function create(name, logger, fileCount, processCount) {
  if (name === 'progress') {
    return createProgressReporter(logger, fileCount, processCount);
  }
  return createSpecReporter(logger, fileCount, processCount);
}

module.exports = {
  create
};
