'use strict';

const blessed = require('blessed');

const specHelpers = require('./specHelpers');

function createStringLogger() {
  let str = '';
  return {
    log(arg) { str += arg + '\n'; },
    getLog() { return str; }
  };
}

function createOutputBox(screen, index, length) {
  const opts = {
    top: '0',
    height: '80%',
    width: `${Math.round(100 / length)}%`,
    left: `${Math.round(100 * index / length)}%`,
    label: `Process ${index + 1}`,
    border: {
      type: 'line'
    },
    scrollable: true,
    scrollbar: {
      bg: 'blue'
    },
    mouse: true
  };
  console.log('opts', opts);
  const box = blessed.box(opts);
  screen.append(box);
  return box;
}

function createFutureReporter(logger, fileCount, processCount) {
  const screen = blessed.screen({
    smartCSR: true
  });
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  console.log('processCount', processCount);
  const boxes = Array
    .from({ length: parseInt(processCount, 10) })
    .map((_, index) => createOutputBox(screen, index, processCount));

  screen.render();

  return function({ testResult, partial }) {
    if (partial) {
      return;
    }

    const { processIndex } = testResult;
    const box = boxes[parseInt(processIndex, 10)];

    const stringLogger = createStringLogger();
    specHelpers.printResults(stringLogger, testResult.results);

    box.insertBottom([stringLogger.getLog()]);
    box.setScrollPerc(100);
    screen.render();
  };
}

module.exports = createFutureReporter;
