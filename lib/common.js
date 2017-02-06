'use strict';

const TEST_PENDING = 'TEST_PENDING';
const TEST_SUCCESS = 'TEST_SUCCESS';
const TEST_SKIPPED = 'TEST_SKIPPED';
const TEST_FAILURE = 'TEST_FAILURE';
const TEST_RESULTS = 'TEST_RESULT';
const START_TEST_SUITE = 'START_TEST_SUITE';
const SUITE_ERROR = 'SUITE_ERROR';
const LOG = 'LOG';

function reportResult(testFile, results) {
  return {
    type: TEST_RESULTS,
    testFile,
    results
  };
}

function startSuite(testFile, match, timeout) {
  return {
    type: START_TEST_SUITE,
    testFile,
    match,
    timeout
  };
}

function suiteError(testFile, stack) {
  return {
    type: SUITE_ERROR,
    testFile,
    stack
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
  TEST_SKIPPED,
  START_TEST_SUITE,
  LOG,
  reportResult,
  startSuite,
  suiteError,
  log
};
