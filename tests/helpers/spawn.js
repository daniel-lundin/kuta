"use strict";

const spawn = require("child_process").spawn;
const EventEmitter = require("events");

function promisedSpawn(command, args, onData = () => {}) {
  return new Promise(resolve => {
    const process = spawn(command, args);
    let stdout = "";

    process.on("close", exitCode => resolve({ exitCode, stdout }));

    process.stdout.on("data", data => {
      stdout += data;
      if (onData) onData(data);
    });
  });
}

function kutaAsEmitter(processArgs) {
  const kuta = spawn("./bin/cli.js", processArgs);
  let processClosed = false;
  let failures;
  let passes;
  let dataRead = "";
  let fullData = "";
  const processEmitter = new EventEmitter();

  kuta.stdout.on("data", data => {
    dataRead += data.toString();
    fullData += data.toString();
    // process.stdout.write(` > ${data.toString()} < `);
    const matches = dataRead.match(/Passed: (\d+)\nFailed: (\d+)/);
    if (matches && matches.length === 3) {
      dataRead = "";
      passes = parseInt(matches[1], 10);
      failures = parseInt(matches[2], 10);
      processEmitter.emit("completed");
    }
    processEmitter.emit("output");
  });

  kuta.on("close", () => {
    processClosed = true;
  });

  return {
    waitForCompletedRun() {
      return new Promise(resolve => {
        processEmitter.on("completed", resolve);
      });
    },
    waitForOutput() {
      return new Promise(resolve => {
        processEmitter.on("output", resolve);
      });
    },
    failures() {
      return failures;
    },
    passes() {
      return passes;
    },
    isClosed() {
      return processClosed;
    },
    data() {
      return fullData;
    },
    kill() {
      kuta.kill();
    }
  };
}

module.exports = {
  spawn: promisedSpawn,
  kutaAsEmitter
};
