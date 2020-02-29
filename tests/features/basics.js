const test = require("../../src/kuta").test;
const assert = require("assert");

const { spawn } = require("../helpers/spawn");
const { parseResult } = require("../helpers/output-parser");

test("passing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/passing-tests.js"]).then(
    ({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 0);
      assert.equal(passedCount, 3);
    }
  );
});

test("failing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/failing-tests.js"]).then(
    ({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 4);
      assert.equal(passedCount, 0);
    }
  );
});

test("fail by timeout", () => {
  return spawn("./bin/cli.js", [
    "tests/fixtures/slow-test.js",
    "-t",
    "100"
  ]).then(({ stdout }) => {
    const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
    const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
    assert.equal(failedCount, 1);
    assert.equal(passedCount, 0);
  });
});

test.skip("should bail on first failure in --bail mode", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/failing-tests.js", "-b"]).then(
    ({ stdout }) => {
      const { failedCount } = parseResult(stdout);
      assert.equal(failedCount, 1);
    }
  );
});

test("should print error summary after failing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/failing-tests.js", "-e", "-p", "1" , "--reporter=spec"]).then(
    ({ stdout }) => {
      const failedCount = parseInt(stdout.match(/Failed.*(\d)/)[1], 10);
      const passedCount = parseInt(stdout.match(/Passed.*(\d)/)[1], 10);
      assert.equal(failedCount, 4);
      assert.equal(passedCount, 0);

      const failedDetailsCount = stdout.match(/Failing tests:.*/).length;
      assert.equal(failedDetailsCount, 1);
    }
  );
});
