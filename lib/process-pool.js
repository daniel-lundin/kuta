const childProcess = require('child_process');
const path = require('path');

let processes;
let processPoolStarted = false;
let processRestarter = () => {};


function startProcessPool(processCount, requires) {
  if (processPoolStarted) {
    return processes;
  }

  processRestarter = () => {
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
      });
    processPoolStarted = true;
    return processes;
  };

  return processRestarter();
}

function restartProcessPool() {
  processRestarter();
}

function stopProcessPool() {
  processes.forEach(process => process.kill());
  processes = [];
  processPoolStarted = false;
}

function killProcess(processToKill) {
  processToKill.kill();
  processes = processes.filter((process) => process  !== processToKill);
  processPoolStarted = false;
}

module.exports = {
  startProcessPool,
  stopProcessPool,
  restartProcessPool,
  killProcess
};
