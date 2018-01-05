const test = require("../../lib/kuta").test;
const assert = require("assert");

const { spawn } = require("../helpers/spawn");

test("return exit code 0 for passing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/passing-tests.js"]).then(
    ({ exitCode }) => {
      assert.equal(exitCode, 0, "Exit code should be zero");
    }
  );
});

test("return non-zero exit code for failing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/failing-tests.js"]).then(
    ({ exitCode }) => {
      assert(exitCode !== 0, "Exit code should be non-zero");
    }
  );
});

test("should handle broken tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/b0rked-test.js"]).then(
    ({ exitCode }) => {
      assert.equal(exitCode, 10);
    }
  );
});
