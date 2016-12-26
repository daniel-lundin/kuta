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


  test._runGroups = () => {
    const results = [];

    const groupResults = groups.reduce((promise, group) => {
      return promise.then(() => {
        return group._runTests()
          .then((result) => results.push(result));
      });
    }, Promise.resolve());

    return groupResults
      .then(() => results);
  };

  test._runTest = (description, implementation) => {
    return testAsPromise(implementation)
      .then(() => testResult(description, common.TEST_SUCCESS))
      .catch((err) => testResult(description, common.TEST_FAILTURE, err));
  };

  test._runTests = () => {

    befores.forEach(cb => cb());


    // Run test sequentially
    const testChain = Object.keys(tests).reduce((promise, curr) => {
      const test = tests[curr];

      return promise.then(() => {
        beforeEaches.forEach(cb => cb());

        return runTest(test.description, test.implementation)
          .then(updateTestWithResult)
          .then(() => afterEaches.forEach(cb => cb()));
      });
    }, Promise.resolve());


    return testChain
      .then(() => afters.forEach(cb => cb()))
      .then(() => test._runGroups())
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
