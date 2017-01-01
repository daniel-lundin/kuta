'use strict';

const path = require('path');
const common = require('./common');

function testResult(description, result, startTime, details = null) {
  return {
    description,
    result,
    time: new Date() - startTime,
    details: details ? details.stack : null
  };
}

function asPromiseWithTimeout(implementation, timeout = 2000) {
  const timeoutPromise = new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error('Test timed out')) , timeout)
  );

  return Promise.race([
    timeoutPromise,
    Promise.resolve().then(() => implementation())
  ]);
}

const arrayAsPromise = (array) =>
  array.reduce((promise, func) => promise.then(func), Promise.resolve());

function createTestGroup(groupDescription = null) {
  let befores = [];
  let beforeEaches = [];
  let tests = {};
  let afters = [];
  let afterEaches = [];
  let groups = [];

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
      time: result.time,
      details: result.details
    });
  }


  test._runGroups = (testFile, timeout) => {
    return groups.reduce((promise, group) => {
      return promise.then(() => group._runTests(testFile, timeout));
    }, Promise.resolve());
  };

  test._runTest = (description, implementation, timeout) => {
    const startTime = new Date();
    return asPromiseWithTimeout(implementation, timeout)
      .then(() => testResult(description, common.TEST_SUCCESS, startTime))
      .catch((err) => testResult(description, common.TEST_FAILURE, startTime, err));
  };

  test._runTests = (testFile, timeout) => {
    const startTime = new Date();
    const beforePromises = arrayAsPromise(befores);

    const testChain = Object.keys(tests).reduce((promise, curr) => {
      const currentTest = tests[curr];

      return promise.then(() => {
        beforeEaches.forEach(cb => cb());
        return arrayAsPromise(beforeEaches)
          .then(() => test._runTest(currentTest.description, currentTest.implementation, timeout))
          .then(updateTestWithResult)
          .then(() => arrayAsPromise(afterEaches));
      });
    }, beforePromises);

    return testChain
      .then(() => test._runGroups(testFile, timeout))
      .then(() => arrayAsPromise(afters))
      .catch((err) => test._markAllFailed(err))
      .then(() => test._results(testFile, startTime));
  };

  test._results = (testFile, startTime) => ({
    description: groupDescription || testFile,
    time: startTime ? new Date() - startTime : null,
    results: Object.keys(tests).map((testKey) => tests[testKey]),
    groups: groups.map((group) => group._results())
  });

  test._markAllFailed = (err) => {
    Object.keys(tests).forEach((testKey) => {
      tests[testKey] = Object.assign({}, tests[testKey], {
        result: common.TEST_FAILURE,
        details: err
      });
    });
    groups.forEach((group) => group._markAllFailed());
  };

  test._reset = () => {
    befores = [];
    beforeEaches = [];
    tests = {};
    afters = [];
    afterEaches = [];
    groups = [];
  };

  return test;
}

const test = createTestGroup();

function runTests(testFile, timeout = 2000) {
  test._reset();
  require(path.join(process.cwd(), testFile));
  return test._runTests(testFile, timeout);
}

// function runTest(description, implementation, timeout) {
//   return test._runTest(description, implementation, timeout);
// }

module.exports = {
  test,
  runTests,
//   runTest,
  _createTestGroup: createTestGroup
};
