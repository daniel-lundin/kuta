const assert = require('assert');
const sinon = require('sinon');
const expect = require('chai').expect;

const kuta = require('../lib/kuta');
const common = require('../lib/common');

const promiseTimeout = (callback, timeout = 1) => {
  return new Promise((resolve) => setTimeout(() => {
    callback();
    resolve();
  }, timeout));
};

kuta.test('returning rejected promises should fail', () => {
  const failTest = () => Promise.reject('eee');
  return kuta.runTest('failing test', failTest)
    .then((result) => {
      assert.equal(result.result, common.TEST_FAILTURE, 'should fail');
    });
});

kuta.test.group('group test', (it) => {
  const firstBeforeSpy = sinon.stub();
  const firstAfterSpy = sinon.stub();
  const secondBeforeSpy = sinon.stub();
  const secondAfterSpy = sinon.stub();

  it.group('first group', (t) => {
    t.before(firstBeforeSpy);
    t.after(firstAfterSpy);
  });

  it.group('second group', (t) => {
    t.before(secondBeforeSpy);

    t('after from previous group should have been called before', () => {
      sinon.assert.callOrder(
        firstBeforeSpy,
        firstAfterSpy,
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

  return test._runTests()
    .then((result) => {
      const testResult = result.results[0];
      expect(testResult).to.have.property('time');
      expect(testResult.time).to.be.within(200, 230);
    });
});
