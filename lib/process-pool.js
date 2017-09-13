const childProcess = require('child_process');
const path = require('path');
const common = require('./common');

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

    processes = Array
      .from({ length: processCount })
      .map((_, index) => {
        const options = Object.assign({}, opts, {
          env: Object.assign({}, process.env, {
            'KUTA_PROCESS_INDEX': index
          })
        });
        return childProcess.fork(path.join(__dirname, './worker.js'), requires, options);
      })
      .map((process) => {
        process.on('exit', () => {
          processPoolStarted = false;
          processes = processes.filter(p => p !== process);
        });
        return process;
      });
    processPoolStarted = true;
    return processes;
  };

  return processPoolStarter();
}

function restartProcessPool() {
  stopProcessPool();
  processPoolStarter();
}

function stopProcessPool() {
  processes.forEach(process => process.send(common.abortSuite()));
  processes = [];
  processPoolStarted = false;
}

module.exports = {
  startProcessPool,
  stopProcessPool,
  restartProcessPool
};
