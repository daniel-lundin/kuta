#!/usr/bin/env node

const path = require('path');
const minimist = require('minimist');
const colors = require('colors');

const runner = require(path.join(__dirname, '../lib/runner'));

const ERR_USAGE = 0;

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
  process.exit(ERR_USAGE);
}


const args = minimist(process.argv.slice(2));
if (args._.length < 1) {
  printUsage();
}

const requires = [].concat(args.require || []).concat([].concat(args.r || []));
const processPool = parseInt(args.processes || args.p || 4, 10);

const files = args._;
runner.run(files, requires, processPool)
  .then((results) => {
    log('');
    log(colors.bold(`Passes: ${colors.green(results.successes)}`));
    log(colors.bold(`Failures: ${colors.red(results.errors)}`));
  })
  .catch((err) => {
    log('Something went wrong', err);
  });
