const assert = require('assert');
const sinon = require('sinon');
const expect = require('chai').expect;

const kuta = require('../lib/kuta');
const feature = require('../lib/bdd').feature;
const common = require('../lib/common');

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

kuta.test.group('group test', (it) => {
  const firstBeforeEachSpy = sinon.stub();
  const firstAfterEachSpy = sinon.stub();
  const firstBeforeSpy = sinon.stub();
  const firstAfterSpy = sinon.stub();
  const secondBeforeSpy = sinon.stub();
  const secondAfterSpy = sinon.stub();

  it.beforeEach(firstBeforeEachSpy);
  it.afterEach(firstAfterEachSpy);

  it.group('first group', (t) => {
    t.before(firstBeforeSpy);
    t.after(firstAfterSpy);
    t('first group tests', () => {
    });
  });

  it.group('second group', (t) => {
    t.before(secondBeforeSpy);

    t('after from previous group should have been called before', () => {
      sinon.assert.callCount(firstAfterEachSpy, 1);
      sinon.assert.callOrder(
        firstBeforeSpy,
        firstBeforeEachSpy,
        firstAfterSpy,
        firstAfterEachSpy,
        secondBeforeSpy
      );
    });

    t.after(secondAfterSpy);
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

  return test._runTests('a testfile', [])
    .then((result) => {
      const testResult = result.results[0];
      expect(testResult).to.have.property('time');
      expect(testResult.time).to.be.within(200, 300);
    });
});

kuta.test('complete test by callback', () => {
  const test = kuta._createTestGroup();
  const testStub = sinon.stub();
  const beforeStub = sinon.stub();

  test.before((resolve) => {
    setTimeout(() => {
      beforeStub();
      resolve();
    }, 200);
  });

  test('a test', (resolve) => {
    setTimeout(() => {
      testStub();
      resolve();
    }, 200);
  });

  return test._runTests('a testfile', [])
    .then(() => {
      sinon.assert.calledOnce(beforeStub);
      sinon.assert.calledOnce(testStub);
    });
});

kuta.test('handle exception in callback-style test', () => {
  const test = kuta._createTestGroup();

  test('callback exception', (done) => {
    setImmediate(() => {
      assert(false);
      done();
    });
  });

  return test._runTests('a testfile', [])
    .then((res) => {
      assert.equal(res.results[0].result, common.TEST_FAILURE);
    });
});

feature('timeouts', (scenario) => {
  scenario('timeout long running test', ({ before, after, given, when, then }) => {
    let clock;
    let testSuite;
    let suitePromise;

    before(() => {
      clock = sinon.useFakeTimers();
    });

    after(() => {
      clock.restore();
    });

    given('a test suite with a 1000ms test and timeout set to 500ms', () => {
      testSuite = kuta._createTestGroup();

      testSuite.timeout(500)('a test', () => {
        return promiseTimeout(() => {}, 1000);
      });
    });

    when('the testSuite starts running', () => {
      suitePromise = testSuite._runTests('a filename', []);
    });

    when('clock runs 1000ms', () => {
      clock.tick(1000);
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
