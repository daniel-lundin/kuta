const assert = require("assert");

const { test } = require("../../src/kuta.js");
const { spawn } = require("../helpers/spawn");
const { parseResult } = require("../helpers/output-parser.js");

test("four 1s suites should run in ~2s with 2 processes", () => {
  const startTime = Date.now();
  return spawn("./bin/cli.js", [
    "-p",
    "2",
    "tests/fixtures/slow-test.js",
    "tests/fixtures/slow-test.js",
    "tests/fixtures/slow-test.js",
    "tests/fixtures/slow-test.js"
  ]).then(({ exitCode }) => {
    const testDuration = Date.now() - startTime;
    assert(testDuration < 3000, `Tests took to long ${testDuration}`);
    assert.equal(exitCode, 0);
  });
});

test("four 1s suits should run in ~1s with 4 processes", () => {
  const startTime = Date.now();

  return spawn("./bin/cli.js", [
    "-p",
    "4",
    "tests/fixtures/slow-test.js",
    "tests/fixtures/slow-test.js"
  ]).then(({ exitCode }) => {
    const testDuration = Date.now() - startTime;
    assert(testDuration < 1500, `Tests took to long ${testDuration}`);
    assert.equal(exitCode, 0);
  });
});

test("should send environment varible with process index", () => {
  const files = [
    "tests/fixtures/pass-if-process-index-1.js",
    "tests/fixtures/pass-if-process-index-1.js"
  ];

  return spawn("./bin/cli.js", ["-p", "2", ...files]).then(
    ({ stdout, exitCode }) => {
      const { failedCount, passedCount } = parseResult(stdout);

      assert.notEqual(exitCode, 0);
      assert.equal(failedCount, 1);
      assert.equal(passedCount, 1);
    }
  );
});
