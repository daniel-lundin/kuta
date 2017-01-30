#!/usr/bin/env node

const path = require('path');
const minimist = require('minimist');
const colors = require('colors');
const glob = require('glob');
const fs = require('fs');
const readline = require('readline');

const runner = require(path.join(__dirname, '../lib/runner'));
const logger = require(path.join(__dirname, '../lib/logger'));
const utils = require(path.join(__dirname, '../lib/utils'));

const EXIT_CODE_OK = 0;
const EXIT_CODE_USAGE = 1;
const EXIT_CODE_FAILURES = 2;

const DEFAULT_TIMEOUT = 2000;

function readFromConfig() {
  return new Promise((resolve) => {
    fs.readFile('./package.json', (err, data) => {
      if (err) {
        return resolve({
          processes: 4,
          requires: [],
          files: []
        });
      }
      const config = JSON.parse(data);
      const kutaConfig = config.kuta || {};
      return resolve({
        processes: kutaConfig.processes || 4,
        requires: kutaConfig.requires || [],
        files: kutaConfig.files || [],
        timeout: kutaConfig.timeout || DEFAULT_TIMEOUT,
        watch: kutaConfig.watch || '',
        match: kutaConfig.match || []
      });
    });
  });
}


function printUsage(exitCode = EXIT_CODE_USAGE) {
  logger.log('');
  logger.log('  Usage: kuta [options] testfiles');
  logger.log('');
  logger.log(' Options: ');
  logger.log('');
  logger.log('  -r, --require\t\t\tfiles to require before running tests');
  logger.log('  -p, --processes\t\tNumber of processes in the process pool');
  logger.log('  -t, --timeout\t\t\tNumber of milliseconds before tests timeout');
  logger.log('  -w, --watch [dir1,dir2]\tDirectories to watch for changes and re-run tests');
  logger.log('  -m, --match\t\t\tRun only test that match this string');
  logger.log('  -h, --help \t\t\tPrint this help');
  logger.log('');
  process.exit(exitCode);
}

function printInteractivePrompt() {
  logger.log('');
  logger.log('Commands:');
  logger.log('r - re-run tests');
  logger.log('m - enter a match string');
  logger.log('mc - clear match string');
  logger.log('x - exit');
  logger.logNoNL('> ');
}

function promiseGlob(globPattern) {
  return new Promise((resolve, reject) => {
    glob(globPattern, (err, files) => {
      if (err) return reject(err);
      return resolve(files);
    });
  });
}

function startTests(watchMode, testMatch = null) {
  return readFromConfig()
    .then((config) => {
      const args = minimist(process.argv.slice(2));
      if (args._.length === 0 && config.files.length < 1) {
        printUsage();
      }

      const requires = utils.arrayParam(args.require, args.r);
      const match = utils.arrayParam(args.match, args.m);
      const processes = parseInt(args.processes || args.p, 10);
      const timeout = args.timeout || args.t;
      const files = args._;

      const filePromises = (files.length ? files : config.files)
        .map(promiseGlob)
        .reduce((acc, curr) => acc.concat(curr), []);
      return Promise.all(filePromises)
        .then((files) => files.reduce((acc, curr) => acc.concat(curr), []))
        .then((files) => ({
          requires: requires.length ? requires : config.requires,
          match: testMatch ? testMatch : match.length ? match : config.match,
          processes: processes || config.processes,
          timeout: timeout ? timeout : config.timeout,
          files
        }));
    })
    .then(({ files, match, requires, processes, timeout }) => {
      const matchInfo = match.length ? ` with match "${match[0]}"` : '';
      logger.log(`Running ${files.length} test files${matchInfo}...\n`);
      return runner.run(files, match, requires, processes, timeout)
    })
    .then((results) => {
      logger.log('');
      logger.log(colors.bold(`Passed: ${colors.green(results.successes)}`));
      logger.log(colors.bold(`Failed: ${colors.red(results.errors)}`));
      if (!watchMode) {
        if(results.errors > 0) {
          process.exit(EXIT_CODE_FAILURES);
        }
      }

      return results;
    })
    .catch((err) => {
      process.exit(EXIT_CODE_FAILURES);
      logger.log('Something went wrong', err);
    });
}

function clearScreen() {
  logger.log('\x1Bc');
}

let testInProgress = false;
let startNewRun = false;

function runTests(watchMode, testMatch) {
  testInProgress = true;
  // TODO: Move startTest to seperate file for easier stubbing than this
  module.exports.startTests(watchMode, testMatch).then(() => {
    testInProgress = false;
    if (startNewRun) {
      testInProgress = true;
      startNewRun = false;
      module.exports.clearScreen();
      return runTests(watchMode, testMatch);
    }

    if (watchMode) {
      printInteractivePrompt();
    }
  });
}

function startWatch(dirs) {
  let testMatch = [];

  function debounce(fn, delay) {
    let timer = null;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function _triggerNewRun() {
    if (!testInProgress) {
      module.exports.clearScreen();
      runTests(true, testMatch);
    } else {
      startNewRun = true;
    }
  }

  const triggerNewRun = debounce(_triggerNewRun, 500);

  dirs.forEach((dir) => {
    fs.watch(dir, () => {
      triggerNewRun();
    });
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    if (input === 'r') {
      triggerNewRun();
    }

    if (input.startsWith('m ')) {
      testMatch = [input.slice(2)];
      logger.log('');
      logger.log(colors.bold(`Match set to "${testMatch[0]}"`));
      printInteractivePrompt();
    }

    if (input === 'mc') {
      testMatch = [];
      logger.log('');
      logger.log(colors.bold('Match cleared'));
      printInteractivePrompt();
    }

    if (input === 'x') {
      logger.log('');
      logger.log(colors.rainbow('kthxbai!'));
      logger.log('');
      process.exit(0);
    }
  });
}

if (require.main === module) {
  const args = minimist(process.argv.slice(2));
  if (args.h || args.help) {
    printUsage(EXIT_CODE_OK);
  }
  readFromConfig()
    .then((config) => {
      const watch = args.w || args.watch || config.watch || '';
      if (typeof watch !== 'string') {
        return logger.log(`${colors.bold(colors.yellow('Warning:'))} watch parameter must be a comma-sperated string\n`);
      }
      const watchMode = watch.length > 1;
      if (watchMode) {
        startWatch(watch.split(','));
      }
      runTests(watchMode);
    });
}

module.exports = {
  runTests,
  startTests,
  startWatch,
  clearScreen
};
