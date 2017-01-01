'use strict';

const TEST_PENDING = 'TEST_PENDING';
const TEST_SUCCESS = 'TEST_SUCCESS';
const TEST_FAILURE = 'TEST_FAILURE';
const TEST_RESULTS = 'TEST_RESULT';
const START_TEST_SUITE = 'START_TEST_SUITE';
const LOG = 'LOG';

function reportResult(testFile, results) {
  return {
    type: TEST_RESULTS,
    testFile,
    results
  };
}

function startSuite(testFile, timeout) {
  return {
    type: START_TEST_SUITE,
    testFile,
    timeout
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
  TEST_FAILURE,
  TEST_RESULTS,
  START_TEST_SUITE,
  LOG,
  reportResult,
  startSuite,
  log
};
