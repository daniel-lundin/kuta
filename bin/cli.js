#!/usr/bin/env node

const path = require('path');
const minimist = require('minimist');
const colors = require('colors');
const glob = require('glob');
const fs = require('fs');
const os = require('os');

const runner = require(path.join(__dirname, '../lib/runner'));
const logger = require(path.join(__dirname, '../lib/logger'));
const utils = require(path.join(__dirname, '../lib/utils'));
const common = require(path.join(__dirname, '../lib/common'));
const { restartProcessPool } = require(path.join(__dirname, '../lib/process-pool'));

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
          files: [],
          watch: '',
          reporter: 'spec'
        });
      }
      const config = JSON.parse(data);
      const kutaConfig = config.kuta || {};
      return resolve({
        processes: kutaConfig.processes || os.cpus().length,
        requires: kutaConfig.requires || [],
        files: kutaConfig.files || [],
        timeout: kutaConfig.timeout || DEFAULT_TIMEOUT,
        watch: kutaConfig.watch || '',
        reporter: kutaConfig.reporter || 'spec'
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
  logger.log('  -h, --help \t\t\tPrint this help');
  logger.log('');
  process.exit(exitCode);
}

function printInteractivePrompt() {
  logger.log('');
  logger.log('Waiting for file changes...');
}

function promiseGlob(globPattern) {
  return new Promise((resolve, reject) => {
    glob(globPattern, (err, files) => {
      if (err) return reject(err);
      return resolve(files);
    });
  });
}

function startTests(watchMode) {
  return readFromConfig()
    .then((config) => {
      const args = minimist(process.argv.slice(2));
      if (args._.length === 0 && config.files.length < 1) {
        printUsage();
      }

      const requires = utils.arrayParam(args.require, args.r);
      const processes = parseInt(args.processes || args.p, 10);
      const timeout = args.timeout || args.t;
      const reporter = args.reporter;
      const files = args._;
      const filePromises = (files.length ? files : config.files)
        .map(promiseGlob)
        .reduce((acc, curr) => acc.concat(curr), []);
      return Promise.all(filePromises)
        .then((files) => files.reduce((acc, curr) => acc.concat(curr), []))
        .then((files) =>
          utils.scanForOnlys(files)
            .then((onlyMatches) => ({ files, onlyMatches }))
        )
        .then(({ files, onlyMatches }) => {
          const filteredFiles = files.filter((file) => Object.keys(onlyMatches).includes(file));
          return {
            requires: requires.length ? requires : config.requires,
            match: onlyMatches,
            processes: processes || config.processes,
            timeout: timeout ? timeout : config.timeout,
            reporter: reporter || config.reporter,
            files: Object.keys(onlyMatches).length ? filteredFiles : files
          };
        });
    })
    .then(({ files, match, requires, processes, reporter, timeout }) => {
      logger.log(`Running ${files.length} test file(s) in ${processes} processes...\n`);
      return runner.run(files, match, requires, processes, reporter, timeout, logger);
    })
    .then((results) => {
      if (!watchMode) {
        if(results.errors > 0) {
          process.exit(EXIT_CODE_FAILURES);
        }
      }

      return results;
    });
}

function clearScreen() {
  logger.log('\x1Bc');
}

let testInProgress = false;

function runTests(watchMode) {
  testInProgress = true;
  startTests(watchMode).then(() => {
    testInProgress = false;

    if (watchMode) {
      printInteractivePrompt();
      restartProcessPool();
    }
  })
  .catch((err) => {
    if (err !== common.ABORT_EXIT_CODE) {
      throw err;
    } 
  });
}

function startWatch(dirs) {
  function debounce(fn, delay) {
    let timer = null;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function _triggerNewRun() {
    if (testInProgress) {
      restartProcessPool();
    }
    clearScreen();
    runTests(true);
  }

  const triggerNewRun = debounce(_triggerNewRun, 500);

  dirs.forEach((dir) => {
    const watchOpts = {
      recursive: true
    };
    fs.watch(dir, watchOpts, () => {
      triggerNewRun();
    });
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
