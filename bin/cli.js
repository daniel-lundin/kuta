#!/usr/bin/env node

const minimist = require('minimist');
const colors = require('colors');

const runner = require('../lib/runner');

const ERR_USAGE = 0;

function log(...args) {
  console.log(...args); // eslint-disable-line
}

function printUsage() {
  log('Usage: kuta testfiles [options]');
  process.exit(ERR_USAGE);
}


const args = minimist(process.argv.slice(2));
if (args._.length < 1) {
  printUsage();
}

const files = args._;
runner.run(files)
  .then((results) => {
    log('');
    log(colors.bold(`Passes: ${colors.green(results.successes)}`));
    log(colors.bold(`Failures: ${colors.red(results.errors)}`));
  })
  .catch((err) => {
    log('Something went wrong', err);
  });
