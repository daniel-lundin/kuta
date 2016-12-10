'use strict';

const common = require('./common');

const befores = [];
const beforeEaches = [];
const tests = {};
const afters = [];
const afterEaches = [];

function testResult(description, result, details = null) {
  return {
    description,
    result,
    details: details
  };
}

function _runTest(description, implementation) {
  try {
    implementation();
  } catch(e) {
    const error = `${e.message}\n${e.stack}`;
    return testResult(description, common.TEST_FAILTURE, error);
  }

  return testResult(description, common.TEST_SUCCESS);
}

function _updateTestWithResult(testResult) {
  const test = tests[testResult.description];
  tests[testResult.description] = Object.assign({}, test, {
    result: testResult.result,
    details: testResult.details
  });
}

function test(description, implementation) {
  tests[description] = {
    description,
    implementation,
    result: common.TEST_PENDING,
    details: null
  };
}

test.before = (cb) => {
  befores.push(cb);
};

test.beforeEach = (cb) => {
  beforeEaches.push(cb);
};

test.after = (cb) => {
  afters.push(cb);
};

test.afterEach = (cb) => {
  afterEaches.push(cb);
};

function listTests() {
  return tests.map(test => test.description);
}

function runTests() {
  befores.forEach(cb => cb());

  Object.keys(tests).forEach(testKey => {
    const test = tests[testKey];
    beforeEaches.forEach(cb => cb());

    const testResult = _runTest(test.description, test.implementation);
    _updateTestWithResult(testResult);

    afterEaches.forEach(cb => cb());
  });

  afters.forEach(cb => cb());

  return Object.keys(tests).map((testKey) => {
    return tests[testKey];
  });
}

module.exports = {
  test,
  listTests,
  runTests
};
