'use strict';

const blessed = require('blessed');

const specHelpers = require('./specHelpers');
const utils = require('../utils');
const asciiNumbers = require('./big-ascii-numbers.js');

function trimNewlines(str) {
  return str.replace(/\n$/, '').replace(/^\n/, '');
}

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
    width: `${Math.floor(100 / length)}%`,
    left: `${Math.floor(100 * index / length)}%`,
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
  const box = blessed.box(opts);
  screen.append(box);
  return box;
}

function setToAsciiNumber(box, number) {
  const numberString = `${number}`;
  const numberIndices = numberString.split('').map((d) => parseInt(d, 10));
  const asciiDigits = numberIndices.map((numberIndex) => asciiNumbers[numberIndex]);

  const digitHeight = 5;
  Array.from({ length: digitHeight }).forEach((_, digitRow) => {
    const digitRowString = asciiDigits.reduce((acc, curr) => ` ${acc}${curr[digitRow]} `, '');
    box.setLine(digitRow + 1, digitRowString);
  });
}

function createSummaryBox(screen) {
  const passesOpts = {
    bottom: '0',
    height: '20%',
    width: '25%',
    left: '25%',
    label: 'Passes',
    border: {
      type: 'line'
    },
    style: {
      fg: 'green'
    }
  };
  const errorOpts = {
    bottom: '0',
    height: '20%',
    width: '25%',
    left: '50%',
    label: 'Failures',
    border: {
      type: 'line'
    },
    style: {
      fg: 'red'
    }
  };

  const passesBox = blessed.box(passesOpts);
  const failuresBox = blessed.box(errorOpts);
  screen.append(passesBox);
  screen.append(failuresBox);

  return {
    updateSummary(currentResults) {

      const summary = Object.keys(currentResults)
        .map((testFile) => currentResults[testFile].results)
        .map((results) => utils.summarizeResults(results))
        .reduce((acc, curr) => ({
          errors: acc.errors + curr.errors,
          successes: acc.successes + curr.successes
        }), { errors: 0, successes: 0 });

      setToAsciiNumber(passesBox, summary.successes);
      setToAsciiNumber(failuresBox, summary.errors);
    }
  };
}

function createFutureReporter(logger, fileCount, processCount) {
  const screen = blessed.screen({
    smartCSR: true
  });
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  const processBoxes = Array
    .from({ length: parseInt(processCount, 10) })
    .map((_, index) => createOutputBox(screen, index, processCount));

  const summaryBox = createSummaryBox(screen);

  screen.render();

  const currentResults = {};
  return function({ testResult }) {
    const processIndex = parseInt(testResult.processIndex, 10);
    const box = processBoxes[processIndex];

    const stringLogger = createStringLogger();
    specHelpers.printResults(stringLogger, testResult.results);
    const currentOutput = trimNewlines(stringLogger.getLog());
    const lastResult = currentResults[testResult.testFile];

    if (lastResult) {
      box.insertBottom([trimNewlines(currentOutput.replace(lastResult.lastOutput, ''))]);
    } else {
      box.insertBottom([currentOutput]);
    }

    currentResults[testResult.testFile] = {
      results: testResult.results,
      lastOutput: currentOutput
    };


    box.setScrollPerc(100);

    summaryBox.updateSummary(currentResults);
    screen.render();
  };
}

module.exports = createFutureReporter;
