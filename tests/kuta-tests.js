const assert = require('assert');

const kuta = require('../lib/kuta');
const common = require('../lib/common');

kuta.test('returning rejected promises should fail', () => {
  const failTest = () => Promise.reject('eee');
  return kuta.runTest('failing test', failTest)
    .then((result) => {
      assert.equal(result.result, common.TEST_FAILTURE, 'should fail');
    });
});
