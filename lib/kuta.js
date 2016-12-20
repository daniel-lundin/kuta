'use strict';

const path = require('path');
const common = require('./common');

function testResult(description, result, details = null) {
  return {
    description,
    result,
    details: details
  };
}

function testAsPromise(test) {
  try {
    return Promise.resolve(test());
  } catch(err) {
    return Promise.reject(err);
  }
}

function createTestGroup(description = null, level = 1) {
  const befores = [];
  const beforeEaches = [];
  const tests = {};
  const afters = [];
  const afterEaches = [];
  const groups = [];

  // Public API
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

  test.group = (description, implementation) => {
    const group = createTestGroup(description, level + 1);
    implementation(group);
    groups.push(group);
  };

  // Internals
  // ---------

  function updateTestWithResult(testResult) {
    const test = tests[testResult.description];
    tests[testResult.description] = Object.assign({}, test, {
      result: testResult.result,
      details: testResult.details
    });
  }

  test._runTest = (description, implementation) => {
    return testAsPromise(implementation)
      .then(() => testResult(description, common.TEST_SUCCESS))
      .catch((err) => testResult(description, common.TEST_FAILTURE, err));
  };

  test._runTests = () => {

    befores.forEach(cb => cb());
    let testChain = Promise.resolve();

    Object.keys(tests).forEach(testKey => {
      const test = tests[testKey];

      testChain = testChain.then(() => {
        beforeEaches.forEach(cb => cb());

        return runTest(test.description, test.implementation)
          .then(updateTestWithResult)
          .then(() => afterEaches.forEach(cb => cb()));
      });
    });

    return testChain
      .then(() => afters.forEach(cb => cb()))
      .then(() => Promise.all(groups.map((group) => group._runTests())))
      .then((groupTests) => {
        return Object.keys(tests)
          .map((testKey) => tests[testKey])
          .concat(...groupTests);
      });
  };

  return test;
}

const test = createTestGroup();


function runTests(testFile) {
  require(path.join(process.cwd(), testFile));
  return test._runTests();
}

function runTest(description, implementation) {
  return test._runTest(description, implementation);
}

module.exports = {
  test,
  runTests,
  runTest
};
