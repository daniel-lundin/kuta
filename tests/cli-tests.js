const spawn = require("child_process").spawn;

const test = require("../lib/kuta").test;
const assert = require("assert");

function promisedExec(command, args, onData = () => {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let stdout = "";

    process.on("close", code => {
      if (code === 0) {
        return resolve(stdout);
      }
      return reject({ stdout, code });
    });

    process.stdout.on("data", data => {
      stdout += data;
      if (onData) onData(data);
    });
  });
}

test.skip("should bail on first failure in --bail mode", () => {
  return promisedExec("./bin/cli.js", [
    "tests/fixtures/failing-tests.js",
    "-b"
  ]).catch(({ stdout }) => {
    const matches = stdout.match(/Failed: (\d+)/);
    const failures = parseInt(matches[1], 10);

    assert.equal(failures, 1);
  });
});
