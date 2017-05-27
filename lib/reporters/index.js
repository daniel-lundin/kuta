'use strict';

const createSpecReporter = require('./spec');
const createProgressReporter = require('./progress');

function create(name, logger, fileCount) {
  if (name === 'progress') {
    return createProgressReporter(logger, fileCount);
  }
  return createSpecReporter(logger, fileCount);
}

module.exports = {
  create
};
