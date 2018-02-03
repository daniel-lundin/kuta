const childProcess = require("child_process");
const path = require("path");

let processes = [];
let processPoolStarted = false;
let processPoolStarter = () => {};

function startProcessPool(processCount, requires) {
  if (processPoolStarted) {
    return processes;
  }

  processPoolStarter = () => {
    const opts = {
      cwd: process.cwd()
    };

    processes = Array.from({ length: processCount }).map((_, index) => {
      const options = Object.assign({}, opts, {
        env: Object.assign({}, process.env, {
          KUTA_PROCESS_INDEX: index
        })
      });
      return childProcess.fork(
        path.join(__dirname, "./worker.js"),
        requires,
        options
      );
    });
    processPoolStarted = true;
    return processes;
  };

  return processPoolStarter();
}

function broadcast(message) {
  processes.forEach(process => process.send(message));
}

function stopProcessPool() {
  processes.forEach(process => {
    process.kill();
  });
  processPoolStarted = false;
}

module.exports = {
  startProcessPool,
  stopProcessPool,
  broadcast
};
