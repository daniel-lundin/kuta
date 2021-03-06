"use strict";

const TEST_PENDING = "TEST_PENDING";
const TEST_SUCCESS = "TEST_SUCCESS";
const TEST_SKIPPED = "TEST_SKIPPED";
const TEST_FAILURE = "TEST_FAILURE";
const TEST_RESULTS = "TEST_RESULT";
const PARTIAL_TEST_RESULTS = "PARTIAL_TEST_RESULT";
const START_TEST_SUITE = "START_TEST_SUITE";
const STOP_TESTS = "STOP_TESTS";
const SUITE_ERROR = "SUITE_ERROR";
const ABORT_SUITE = "ABORT_SUITE";
const LOG = "LOG";

const ABORT_EXIT_CODE = 10;

function reportResult(testFile, results) {
  return {
    type: TEST_RESULTS,
    testFile,
    processIndex: process.env.KUTA_PROCESS_INDEX,
    results
  };
}

function reportPartialResults(testFile, results) {
  return {
    type: PARTIAL_TEST_RESULTS,
    processIndex: process.env.KUTA_PROCESS_INDEX,
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

function stopTests() {
  return {
    type: STOP_TESTS
  };
}

function suiteError(testFile, stack) {
  return {
    type: SUITE_ERROR,
    processIndex: process.env.KUTA_PROCESS_INDEX,
    testFile,
    stack
  };
}

function abortSuite() {
  return {
    type: ABORT_SUITE
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
  PARTIAL_TEST_RESULTS,
  TEST_SKIPPED,
  START_TEST_SUITE,
  STOP_TESTS,
  SUITE_ERROR,
  ABORT_SUITE,
  ABORT_EXIT_CODE,
  LOG,
  reportResult,
  reportPartialResults,
  startSuite,
  stopTests,
  suiteError,
  abortSuite,
  log
};
