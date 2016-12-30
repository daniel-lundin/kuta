#!/usr/bin/env node

const path = require('path');
const minimist = require('minimist');
const colors = require('colors');
const glob = require('glob');

const runner = require(path.join(__dirname, '../lib/runner'));

const EXIT_CODE_USAGE = 1;
const EXIT_CODE_FAILURES = 2;

function log(...args) {
  console.log(...args); // eslint-disable-line
}

function printUsage() {
  log('');
  log('  Usage: kuta [options] testfiles');
  log('');
  log(' Options: ');
  log('');
  log('  -r, --require\t\tfiles to require before running tests');
  log('  -p, --processes\tNumber of processes in the process pool');
  log('');
  process.exit(EXIT_CODE_USAGE);
}

function promiseGlob(globPattern) {
  return new Promise((resolve) => {
    glob(globPattern, (err, files) => resolve(files));
  });
}


const args = minimist(process.argv.slice(2));
if (args._.length < 1) {
  printUsage();
}

const requires = [].concat(args.require || []).concat([].concat(args.r || []));
const processPool = parseInt(args.processes || args.p || 4, 10);

const files = args._;
const filePromises = files
  .map(promiseGlob)
  .reduce((acc, curr) => acc.concat(curr), []);

Promise.all(filePromises)
  .then((files) => files.reduce((acc, curr) => acc.concat(curr), []))
  .then((files) => runner.run(files, requires, processPool))
  .then((results) => {
    log('');
    log(colors.bold(`Passed: ${colors.green(results.successes)}`));
    log(colors.bold(`Failed: ${colors.red(results.errors)}`));

    if (results.errors > 0) {
      process.exit(EXIT_CODE_FAILURES);
    }
  })
  .catch((err) => {
    process.exit(EXIT_CODE_FAILURES);
    log('Something went wrong', err);
  });


