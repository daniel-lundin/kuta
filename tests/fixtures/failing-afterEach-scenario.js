const { afterEach, Feature, Scenario, Given, When, Then } = require("../../src/mocha-compat.js");

Feature("a mocha cakes feature", () => {
  Scenario("cakes scenario", () => {
    afterEach(() => {
      throw new Error("");
    });

    Given("this fails", () => {});
    When("this is skipped", () => {});
    Then("this is skipped", () => {});
  });
});
