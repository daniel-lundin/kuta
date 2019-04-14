const {
  describe,
  it,
  before,
  after,
  Feature,
  Scenario,
  Given,
  When,
  Then
} = require('../../src/mocha-compat.js');
const assert = require('assert');
const sinon = require('sinon');


const testObject = {
  method() {}
};

describe.only('outer describe', () => {
  before(() => {
    sinon.stub(testObject, 'method');
  });

  after(() => {
    testObject.method.restore();
  });

  it.only('outer test', () => {
    testObject.method();
  });

  describe('inner describe', () => {
    it('inner test', () => {
      testObject.method();
    });

    describe('inner inner describe', () => {
      it('deep down the rabbit hole', () => {
        sinon.assert.callCount(testObject.method, 2);
      });

      it('nested simple test', () => {
        assert(true);
      });
    });
  });
});

Feature.only('this is a feature', () => {
  Scenario('a scenario', () => {
    Given('something', () => {
    });

    When('something', () => {
    });

    Then('something', () => {
    });
  });
});

Feature('feature', () => {
  Scenario('skipped', () => {
    Given('something', () => {
      throw new Error('should not run');
    });
  });

  Scenario.only('should run', () => {
    Then('something', () => {
    });
  });
});
