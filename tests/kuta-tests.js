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
  const outerBeforeEach = sinon.stub();
  const outerAfterEach = sinon.stub();
  const innerBeforeEach = sinon.stub();
  const innerAfterEach = sinon.stub();
  const firstBefore = sinon.stub();
  const firstAfter = sinon.stub();
  const secondBefore = sinon.stub();

  it.beforeEach(outerBeforeEach);
  it.afterEach(outerAfterEach);

  it.group('first group', (t) => {
    t.before(firstBefore);
    t.after(firstAfter);
    t.beforeEach(innerBeforeEach);
    t.afterEach(innerAfterEach);

    t('first group tests', () => {
    });
  });

  it.group('second group', (t) => {
    t.before(secondBefore);

    t('*eaches should run in correct order', () => {
      sinon.assert.callOrder(
        outerBeforeEach,
        innerBeforeEach,
        innerAfterEach,
        outerAfterEach
      );
    });

    t('after from previous group should have been called before', () => {
      sinon.assert.callOrder(
        firstBefore,
        outerBeforeEach,
        outerAfterEach,
        firstAfter,
        secondBefore,
        outerBeforeEach
      );
    });

    t('beforeEach in outer group should run beforeEach test in inner', () => {
      sinon.assert.callCount(outerBeforeEach, 4);
    });
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

  test.before((done) => {
    setTimeout(() => {
      beforeStub();
      done();
    }, 200);
  });

  test('a test', (done) => {
    setTimeout(() => {
      testStub();
      done();
    }, 200);
  });

  test('fail by callback', (done) => {
    done('error');
  });

  return test._runTests('a testfile', [])
    .then((results) => {
      sinon.assert.calledOnce(beforeStub);
      sinon.assert.calledOnce(testStub);
      assert.equal(results.results[1].result, 'TEST_FAILURE');
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

  return test._runTests('a testfile', [])
    .then((res) => {
      assert.equal(res.results[0].result, common.TEST_SUCCESS);
      assert.equal(res.results[1].result, common.TEST_SUCCESS);
    });
});

kuta.test('matched inner test should run outer lifecycle hooks', () => {
  const outerBefore = sinon.stub();
  const outerBeforeEach = sinon.stub();
  const test = kuta._createTestGroup();

  test.before(() => {
    outerBefore();
  });

  test.beforeEach(() => {
    outerBeforeEach();
  });

  test('foo', () => {});

  test.group('group', (t) => {
    t('matched test', () => {
      sinon.assert.calledOnce(outerBefore);
      sinon.assert.calledOnce(outerBeforeEach);
    });
  });

  return test._runTests('noop', ['matched test'])
    .then((res) => {
      assert.equal(res.groups.length, 1);
      assert.equal(res.groups[0].results[0].result, common.TEST_SUCCESS);
    });
});

kuta.test.group('exception in hooks', (test) => {
  const testGroup = kuta._createTestGroup();

  testGroup.group('this is a group', (t) => {
    t.after(() => {
      throw new Error('FAIL!!1');
    });

    t('a passing test', () => {});
    t('a skipped test', () => {});
  });

  test('should mark all test in group failed', () => {
    return testGroup._runTests('noop', [])
      .then((res) => {
        const { results } = res.groups[0];
        assert.equal(results[0].result, common.TEST_FAILURE);
        assert.equal(results[1].result, common.TEST_FAILURE);
      });
  });

  test('except for already skipped tests', () => {
    return testGroup._runTests('noop', ['passing test'])
      .then((res) => {
        const { results } = res.groups[0];
        assert.equal(results[0].result, common.TEST_FAILURE);
        assert.equal(results[1].result, common.TEST_SKIPPED);
      });
  });
});

kuta.test('should not run befores/afters for tests that don\'t match', () => {
  const test = kuta._createTestGroup();
  const before = sinon.stub();
  const after = sinon.stub();

  test.before(before);
  test.after(after);

  test.group('group', (t) => {
    t('random', () => {});
  });

  return test._runTests('nofile', ['matching'])
    .then(() => {
      sinon.assert.notCalled(before);
      sinon.assert.notCalled(after);
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
      suitePromise = testSuite._runTests('a filename', []);
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

  return test._runTests('nofile', [])
    .then((results) => {
      assert.equal(results.results.length, 1);
    });
});
