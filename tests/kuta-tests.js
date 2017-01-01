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

// kuta.test('returning rejected promises should fail', () => {
//   const failTest = () => Promise.reject('eee');
//   return kuta.runTest('failing test', failTest)
//     .then((result) => {
//       assert.equal(result.result, common.TEST_FAILURE, 'should fail');
//     });
// });
// 
// kuta.test.group('group test', (it) => {
//   const firstBeforeSpy = sinon.stub();
//   const firstAfterSpy = sinon.stub();
//   const secondBeforeSpy = sinon.stub();
//   const secondAfterSpy = sinon.stub();
// 
//   it.group('first group', (t) => {
//     t.before(firstBeforeSpy);
//     t.after(firstAfterSpy);
//   });
// 
//   it.group('second group', (t) => {
//     t.before(secondBeforeSpy);
// 
//     t('after from previous group should have been called before', () => {
//       sinon.assert.callOrder(
//         firstBeforeSpy,
//         firstAfterSpy,
//         secondBeforeSpy
//       );
//     });
// 
//     t.after(secondAfterSpy);
//   });
// });
// 
// 
// kuta.test.group('async before/afters', (t) => {
//   const beforeFunc = sinon.spy();
//   t.before(() => {
//     return promiseTimeout(beforeFunc);
//   });
// 
//   t('test should not start before before is completed', () => {
//     sinon.assert.calledOnce(beforeFunc);
//   });
// });
// 
// kuta.test('measure time for each test', () => {
// 
//   const test = kuta._createTestGroup();
// 
//   test('a test', () => {
//     return promiseTimeout(() => {}, 200);
//   });
// 
//   return test._runTests()
//     .then((result) => {
//       const testResult = result.results[0];
//       expect(testResult).to.have.property('time');
//       expect(testResult.time).to.be.within(200, 230);
//     });
// });

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

    given('a test suite with a 1000ms test', () => {
      testSuite = kuta._createTestGroup();

      testSuite('a test', () => {
        return promiseTimeout(() => {}, 1000);
      });
    });

    when('the testSuite starts running with timeout set to 500ms', () => {
      suitePromise = testSuite._runTests('a filename', 500);
    });

    when('clock runs 750ms', () => {
      clock.tick(750);
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
