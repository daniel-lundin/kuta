'use strict';

const path = require('path');
const common = require('./common');

function testResult(description, result, details = null) {
  return {
    description,
    result,
    details: details ? details.stack : null
  };
}

function testAsPromise(test) {
  try {
    return Promise.resolve(test());
  } catch(err) {
    return Promise.reject(err);
  }
}

function createTestGroup(groupDescription = null) {
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

  test.group = (groupDescription, implementation) => {
    const group = createTestGroup(groupDescription);
    implementation(group);
    groups.push(group);
  };

  // Internals
  // ---------

  function updateTestWithResult(result) {
    const test = tests[result.description];
    tests[result.description] = Object.assign({}, test, {
      result: result.result,
      details: result.details
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

  test._runTests = (testFile) => {

    // TODO: Handle exceptions
    befores.forEach(cb => cb());

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
      .then((groupResults) => {
        const results = Object.keys(tests).map((testKey) => tests[testKey]);
        return {
          description: groupDescription || testFile,
          results: results,
          groups: groupResults
        };
      });
  };

  return test;
}

const test = createTestGroup();


function runTests(testFile) {
  require(path.join(process.cwd(), testFile));
  return test._runTests(testFile);
}

function runTest(description, implementation) {
  return test._runTest(description, implementation);
}

module.exports = {
  test,
  runTests,
  runTest
};
