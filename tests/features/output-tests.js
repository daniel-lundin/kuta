const test = require("../../src/kuta").test;
const assert = require("assert");

const { spawn } = require("../helpers/spawn");

test("return exit code 0 for passing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/passing-tests.js"]).then(({ exitCode }) => {
    assert.strictEqual(exitCode, 0, "Exit code should be zero");
  });
});

test("return non-zero exit code for failing tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/failing-tests.js"]).then(({ exitCode }) => {
    assert(exitCode !== 0, "Exit code should be non-zero");
  });
});

test("should handle broken tests", () => {
  return spawn("./bin/cli.js", ["tests/fixtures/b0rked-test.js"]).then(({ exitCode }) => {
    assert.strictEqual(exitCode, 10);
  });
});

test("should print test times when running single file", () => {
  return spawn("./bin/cli.js", ["--reporter", "spec", "tests/fixtures/passing-tests.js"]).then(({ stdout }) => {
    const count = parseInt(stdout.match(/\((\d+) ms\)/g).length, 10);
    assert.strictEqual(count, 4);
  });
});

test("should print test times when running tests in parallel", () => {
  return spawn("./bin/cli.js", [
    "--reporter",
    "spec",
    "-p",
    "2",
    "tests/fixtures/passing-tests.js",
    "tests/fixtures/passing-tests.js",
  ]).then(({ stdout }) => {
    const count = parseInt(stdout.match(/\((\d+) ms\)/g).length, 10);
    assert.strictEqual(count, 8);
  });
});

test("should print test times for groups in bdd files", () => {
  return spawn("./bin/cli.js", ["--reporter", "spec", "tests/fixtures/bdd-multiple-scenarios-file.js"]).then(
    ({ stdout }) => {
      const count = parseInt(stdout.match(/\((\d+) ms\)/g).length, 10);
      assert.strictEqual(count, 15);

      const featureTimes = parseInt(stdout.match(/Feature.*\((\d+) ms\)/g).length, 10);
      assert.strictEqual(featureTimes, 2);

      const scenarioTimes = parseInt(stdout.match(/Scenario.*\((\d+) ms\)/g).length, 10);
      assert.strictEqual(scenarioTimes, 3);
    }
  );
});

test("should print test times for groups in bdd files in parallel", () => {
  return spawn("./bin/cli.js", [
    "--reporter",
    "spec",
    "-p",
    "2",
    "tests/fixtures/bdd-multiple-scenarios-file.js",
    "tests/fixtures/passing-tests.js",
  ]).then(({ stdout }) => {
    const count = parseInt(stdout.match(/\((\d+) ms\)/g).length, 10);
    assert.strictEqual(count, 19);

    const featureTimes = parseInt(stdout.match(/Feature.*\((\d+) ms\)/g).length, 10);
    assert.strictEqual(featureTimes, 2);

    const scenarioTimes = parseInt(stdout.match(/Scenario.*\((\d+) ms\)/g).length, 10);
    assert.strictEqual(scenarioTimes, 3);
  });
});
