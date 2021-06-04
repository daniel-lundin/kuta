const test = require("../../src/kuta").test;
const assert = require("assert");

const { spawn } = require("../helpers/spawn");

test("return exit code 0 for passing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/passing-tests.js"]).then(({ exitCode }) => {
    assert.equal(exitCode, 0, "Exit code should be zero");
  });
});

test("return non-zero exit code for failing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/failing-tests.js"]).then(({ exitCode }) => {
    assert(exitCode !== 0, "Exit code should be non-zero");
  });
});

test("should handle broken tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/b0rked-test.js"]).then(({ exitCode }) => {
    assert.equal(exitCode, 10);
  });
});

test("should print test times", () => {
  return spawn("./bin/cli.js", ["--reporter", "spec", "tests/fixtures/passing-tests.js"]).then(({ stdout }) => {
    const count = parseInt(stdout.match(/\((\d+) ms\)/g).length, 10);
    assert.strictEqual(count, 7);
  });
});
