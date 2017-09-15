const describe = require('../../lib/bdd.js').describe;
const assert = require('assert');
const sinon = require('sinon');


const testObject = {
  method() {}
};

describe('outer describe', (it) => {

  it.before(() => {
    sinon.stub(testObject, 'method');
  });

  it.after(() => {
    testObject.method.restore();
  });

  it('outer test', () => {
    testObject.method();
  });

  it.describe('inner describe', (it) => {
    it('inner test', () => {
      testObject.method();
    });

    it.describe('inner inner describe', (it) => {
      it('deep down the rabbit hole', () => {
        sinon.assert.callCount(testObject.method, 2);
      });

      it('nested simple test', () => {
        assert(true);
      });
    });
  });
});

