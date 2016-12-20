'use strict';

const TEST_PENDING = 'TEST_PENDING';
const TEST_SUCCESS = 'TEST_SUCCESS';
const TEST_FAILTURE = 'TEST_FAILTURE';
const TEST_RESULTS = 'TEST_RESULT';
const START_TEST_SUITE = 'START_TEST_SUITE';
const LOG = 'LOG';

function reportResult(testFile, tests) {
  return {
    type: TEST_RESULTS,
    testFile,
    tests
  };
}

function startSuite(testFile) {
  return {
    type: START_TEST_SUITE,
    testFile
  };
}

function log(message, err) {
  return {
    type: LOG,
    message,
    err
  };
}

module.exports = {
  TEST_PENDING,
  TEST_SUCCESS,
  TEST_FAILTURE,
  TEST_RESULTS,
  START_TEST_SUITE,
  LOG,
  reportResult,
  startSuite,
  log
};
