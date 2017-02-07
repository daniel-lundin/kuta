'use strict';

const path = require('path');
const common = require('./common');

// Make sure we don't get stubbed
const _setTimeout = setTimeout;

let globalExceptionHandlers = [];
function onGlobalException(callback) {
  globalExceptionHandlers.push(callback);
  return () => {
    globalExceptionHandlers = globalExceptionHandlers.filter((cb) => cb !== callback);
  };
}

process.on('uncaughtException', (err) => {
  globalExceptionHandlers.forEach((handler) => handler(err));
});

function matches(matchStrings, string) {
  return matchStrings.reduce((acc, curr) => {
    return acc && string.indexOf(curr) >= 0;
  }, true);
}

function testResult(description, result, startTime, details = null) {
  return {
    description,
    result,
    time: new Date() - startTime,
    details: details ? details.stack : null
  };
}

function executeCallback(implementation) {
  const takesArguments = implementation.length > 0;
  if (takesArguments) {
    let unregister;
    return new Promise((resolve, reject) => {
      unregister = onGlobalException((err) => {
        unregister();
        reject(err);
      });
      implementation(resolve, reject);
    }).then(() => unregister());
  }
  return implementation();
}

function asPromiseWithTimeout(implementation, timeout = 2000) {
  const timeoutPromise = new Promise((resolve, reject) =>
    _setTimeout(() => reject(new Error('Test timed out')) , timeout)
  );

  return Promise.race([
    timeoutPromise,
    Promise.resolve().then(() => {
      return executeCallback(implementation);
    })
  ]);
}

const arrayAsPromise = (array) =>
  array.reduce((promise, func) => promise.then(() => executeCallback(func)), Promise.resolve());

function createTestGroup(groupDescription = null) {
  let befores = [];
  let beforeEaches = [];
  let tests = [];
  let afters = [];
  let afterEaches = [];
  let groups = [];

  // Public API
  function test(description, implementation, timeout) {
    tests.push({
      description,
      implementation,
      result: common.TEST_PENDING,
      timeout,
      details: null
    });
  }

  test.timeout = (timeout) => {
    return (description, implementation) => {
      return test(description, implementation, timeout);
    };
  };

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

  test._groupDescription = groupDescription;

  // Internals
  // ---------

  function updateTestWithResult(testIndex, result) {
    const test = tests[testIndex];
    tests[testIndex] = Object.assign({}, test, {
      result: result.result,
      time: result.time,
      details: result.details
    });
  }


  test._runGroups = (testFile, match, timeout) => {
    return groups.reduce((promise, group) => {
      return promise.then(() => {
        const childMatch = matches(match, group._groupDescription) ? [] : match;
        return arrayAsPromise(beforeEaches)
          .then(() => group._runTests(testFile, childMatch, timeout))
          .then(() => arrayAsPromise(afterEaches));
      });
    }, Promise.resolve());
  };

  test._runTest = (description, implementation, timeout) => {
    const startTime = new Date();
    return asPromiseWithTimeout(implementation, timeout)
      .then(() => testResult(description, common.TEST_SUCCESS, startTime))
      .catch((err) => testResult(description, common.TEST_FAILURE, startTime, err));
  };

  test._runTests = (testFile, match, timeout) => {
    const startTime = new Date();
    const beforePromises = arrayAsPromise(befores);

    const testChain = tests.reduce((promise, currentTest, testIndex) => {
      if (!matches(match, currentTest.description)) {
        return promise.then(() => {
          const newResult = testResult(currentTest.description, common.TEST_SKIPPED, new Date());
          updateTestWithResult(testIndex, newResult);
        });
      }

      return promise.then(() => {
        return arrayAsPromise(beforeEaches)
          .then(() => test._runTest(currentTest.description, currentTest.implementation, currentTest.timeout || timeout))
          .then((result) => updateTestWithResult(testIndex, result))
          .then(() => arrayAsPromise(afterEaches));
      });
    }, beforePromises);

    return testChain
      .then(() => test._runGroups(testFile, match, timeout))
      .then(() => arrayAsPromise(afters))
      .catch((err) => test._markAllFailed(err))
      .then(() => test._results(testFile, startTime));
  };

  test._results = (testFile, startTime) => ({
    description: groupDescription || testFile,
    time: startTime ? new Date() - startTime : null,
    results: tests,
    groups: groups.map((group) => group._results())
  });

  test._markAllFailed = (err) => {
    tests = tests.map((currentTest) => Object.assign({}, currentTest, {
      result: common.TEST_FAILURE,
      details: err.stack
    }));
    groups.forEach((group) => group._markAllFailed(err));
  };

  test._reset = () => {
    befores = [];
    beforeEaches = [];
    tests = [];
    afters = [];
    afterEaches = [];
    groups = [];
  };

  return test;
}

const test = createTestGroup();

function runTests(testFile, match, timeout = 2000) {
  test._reset();
  require(path.join(process.cwd(), testFile));
  return test._runTests(testFile, match, timeout);
}

module.exports = {
  test,
  runTests,
  _createTestGroup: createTestGroup
};
