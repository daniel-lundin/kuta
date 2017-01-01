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


  test._runGroups = () => {
    return groups.reduce((promise, group) => {
      return promise.then(() => group._runTests());
    }, Promise.resolve());
  };

  test._runTest = (description, implementation) => {
    const startTime = new Date();
    return Promise.resolve()
      .then(() => implementation())
      .then(() => testResult(description, common.TEST_SUCCESS, startTime))
      .catch((err) => testResult(description, common.TEST_FAILTURE, startTime, err));
  };

  test._runTests = (testFile) => {
    const startTime = new Date();
    const beforePromises = arrayAsPromise(befores);

    const testChain = Object.keys(tests).reduce((promise, curr) => {
      const test = tests[curr];

      return promise.then(() => {
        beforeEaches.forEach(cb => cb());

        return runTest(test.description, test.implementation)
          .then(updateTestWithResult)
          .then(() => arrayAsPromise(afterEaches));
      });
    }, beforePromises);

    return testChain
      .then(() => test._runGroups())
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
        result: common.TEST_FAILTURE,
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

function runTests(testFile) {
  test._reset();
  require(path.join(process.cwd(), testFile));
  return test._runTests(testFile);
}

function runTest(description, implementation) {
  return test._runTest(description, implementation);
}

module.exports = {
  test,
  runTests,
  runTest,
  _createTestGroup: createTestGroup
};
