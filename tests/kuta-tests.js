const assert = require('assert');
const sinon = require('sinon');
const expect = require('chai').expect;

const kuta = require('../lib/kuta');
const feature = require('../lib/bdd').feature;
const common = require('../lib/common');

const IPCMock = {
  send(message) { return message; }
};

const promiseTimeout = (callback, timeout = 1) => {
  return new Promise((resolve) => setTimeout(() => {
    callback();
    resolve();
  }, timeout));
};

kuta.test('returning rejected promises should fail', () => {
  const failTest = () => Promise.reject('eee');
  return kuta.test._runTest('failing test', failTest)
    .then((result) => {
      assert.equal(result.result, common.TEST_FAILURE, 'should fail');
    });
});

kuta.test.group('async before/afters', (t) => {
  const beforeFunc = sinon.spy();

  t.before(() => {
    return promiseTimeout(beforeFunc);
  });

  t('test should not start before before is completed', () => {
    sinon.assert.calledOnce(beforeFunc);
  });
});

kuta.test('measure time for each test', () => {
  const test = kuta._createTestGroup();

  test('a test', () => {
    return promiseTimeout(() => {}, 200);
  });

  return test._runTests('a testfile', [], 1000, IPCMock)
    .then((result) => {
      const testResult = result.results[0];
      expect(testResult).to.have.property('time');
      expect(testResult.time).to.be.within(200, 300);
    });
});

kuta.test('should let event loop run in between', () => {
  const immediateCall = sinon.stub();
  const test = kuta._createTestGroup();

  test('callback exception', () => {
    setImmediate(() => {
      immediateCall();
    });
  });

  test('timeout should have fired', () => {
    sinon.assert.calledOnce(immediateCall);
  });

  return test._runTests('a testfile', [], 1000, IPCMock)
    .then((res) => {
      assert.equal(res.results[0].result, common.TEST_SUCCESS);
      assert.equal(res.results[1].result, common.TEST_SUCCESS);
    });
});

feature('timeouts', (scenario) => {
  scenario('timeout long running test', ({ given, when, then }) => {
    let testSuite;
    let suitePromise;

    given('a test suite with a 100ms test and timeout set to 50ms', () => {
      testSuite = kuta._createTestGroup();

      testSuite.timeout(50)('a test', () => {
        return promiseTimeout(() => {}, 100);
      });
    });

    when('the testSuite starts running', () => {
      suitePromise = testSuite._runTests('a filename', [], 1000, IPCMock);
    });

    then('the test in the suite should fail due to timeout', () => {
      return suitePromise
        .then((result) => {
          const testResult = result.results[0];
          expect(testResult).to.have.property('result', common.TEST_FAILURE);
          expect(testResult.details).to.match(/Test timed out/);
        });
    });
  });
});

kuta.test('should skip .skip()', () => {
  const test = kuta._createTestGroup();


  test('not skipped', () => {
  });

  test.skip('skipped', () => {
  });

  test.group.skip('skipped', (t) => {
    t('also skipped', () => {});
  });

  return test._runTests('nofile', [], 1000, IPCMock)
    .then((results) => {
      assert.equal(results.results.length, 1);
    });
});
