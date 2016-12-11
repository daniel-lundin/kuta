'use strict';

const path = require('path');

const common = require('./common');

const befores = [];
const beforeEaches = [];
const tests = {};
const afters = [];
const afterEaches = [];

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

function testResult(description, result, details = null) {
  return {
    description,
    result,
    details: details
  };
}

function testAsPromise(func) {
  return new Promise((resolve, reject) => {
    try {
      resolve(func());
    } catch(err) {
      reject(err);
    }
  });
}

function runTest(description, implementation) {
  return testAsPromise(implementation)
    .then(() => testResult(description, common.TEST_SUCCESS))
    .catch((err) => testResult(description, common.TEST_FAILTURE, err.message));
}

function updateTestWithResult(testResult) {
  const test = tests[testResult.description];
  tests[testResult.description] = Object.assign({}, test, {
    result: testResult.result,
    details: testResult.details
  });
}


function listTests() {
  return tests.map(test => test.description);
}

function runTests(testFile) {
  require(path.join('../', testFile));

  befores.forEach(cb => cb());
  let testChain = Promise.resolve();

  Object.keys(tests).forEach(testKey => {
    const test = tests[testKey];

    testChain = testChain.then(() => {
      beforeEaches.forEach(cb => cb());

      return runTest(test.description, test.implementation)
        .then((testResult) => updateTestWithResult(testResult))
        .then(() => afterEaches.forEach(cb => cb()));
    });
  });

  return testChain
    .then(() => afters.forEach(cb => cb()))
    .then(() => Object.keys(tests).map((testKey) => {
      return tests[testKey];
    }));
}

module.exports = {
  test,
  listTests,
  runTests
};
