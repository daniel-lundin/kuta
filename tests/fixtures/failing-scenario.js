const feature = require("../../src/bdd.js").feature;
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
} = require("../../src/mocha-compat.js");
const assert = require("assert");
const sinon = require("sinon");

feature("a feature", scenario => {
  scenario("failing scenario", ({ given, when, then }) => {
    given("a scenario", () => {});

    when("this step fails", () => {
      throw new Error("fail");
    });

    then("this should never execute", () => {});
  });

  scenario("passing scenario", ({ given, when, then }) => {
    given("something given", () => {});
    when("something happens", () => {});
    then("something is expected", () => {});
  });
});

Feature("a mocha cakes feature", () => {
  Scenario("cakes scenario", () => {
    Given("this works", () => {});
    When("this fails", () => {
      throw new Error("fail");
    });
    Then("this is skipped", () => {});
  });
});
