const { feature } = require("../../src/bdd");
const { kutaAsEmitter } = require("../helpers/spawn");
const { assert } = require("chai");

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

feature("errors", scenario => {
  scenario("warn on uncaught errors", s => {
    let kutaEmitter;

    s.after(() => kutaEmitter.kill());

    s.given("a kuta process in test mode", () => {
      kutaEmitter = kutaAsEmitter([
        "-w",
        "tests/fixtures/delayed-exception.js",
        "tests/fixtures/delayed-exception.js",
        "-p",
        "1"
      ]);
    });

    s.when("test run completes", () => kutaEmitter.waitForCompletedRun());
    s.when("waiting some time more", () => sleep(1000));

    s.then("a warning should be printed", () => {
      assert.include(kutaEmitter.data(), "WARNING, uncaught exception");
    });
  });
});
