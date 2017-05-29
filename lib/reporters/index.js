'use strict';

const createSpecReporter = require('./spec');
const createProgressReporter = require('./progress');
const createFutureReporter = require('./future');

function create(name, logger, fileCount, processCount) {
  switch(name) {
  case 'progress':
    return createProgressReporter(logger, fileCount, processCount);
  case 'future':
    return createFutureReporter(logger, fileCount, processCount);
  default:
    return createSpecReporter(logger, fileCount, processCount);
  }
}

module.exports = {
  create
};
