const feature = require("../../src/bdd.js").feature;
const assert = require("assert");
const sinon = require("sinon");

const testObject = {
  method() {}
};

feature("single", scenario => {
  scenario("only scenario", ({ before, after, given, when, then }) => {
    let result = 42;
    before(() => {
      sinon.stub(testObject, "method");
    });

    after(() => {
      testObject.method.restore();
    });

    given("a testMethod that returns 42", () => {
      testObject.method.returns(42);
    });

    when("testMethod is called", () => {
      result = testObject.method();
    });

    then("testMethod should have been calledOnce", () => {
      sinon.assert.calledOnce(testObject.method);
      assert.equal(42, result);
    });
  });
});

feature("double", scenario => {
  scenario("first scenario", ({ before, after, given, when, then }) => {
    let result = 42;
    before(() => {
      sinon.stub(testObject, "method");
    });

    after(() => {
      testObject.method.restore();
    });

    given("a testMethod that returns 42", () => {
      testObject.method.returns(42);
    });

    when("testMethod is called", () => {
      result = testObject.method();
    });

    then("testMethod should have been calledOnce", () => {
      sinon.assert.calledOnce(testObject.method);
      assert.equal(42, result);
    });
  });

  scenario("second scenario", ({ before, after, given, when, then }) => {
    let result = 42;
    before(() => {
      sinon.stub(testObject, "method");
    });

    after(() => {
      testObject.method.restore();
    });

    given("a testMethod that returns 42", () => {
      testObject.method.returns(42);
    });

    when("testMethod is called", () => {
      result = testObject.method();
    });

    then("testMethod should have been calledOnce", () => {
      sinon.assert.calledOnce(testObject.method);
      assert.equal(42, result);
    });
  });
});
