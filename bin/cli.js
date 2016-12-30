#!/usr/bin/env node

const path = require('path');
const minimist = require('minimist');
const colors = require('colors');
const glob = require('glob');
const fs = require('fs');

const runner = require(path.join(__dirname, '../lib/runner'));

const EXIT_CODE_USAGE = 1;
const EXIT_CODE_FAILURES = 2;

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
        files: kutaConfig.files || []
      });
    });
  });
}
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
  return new Promise((resolve, reject) => {
    glob(globPattern, (err, files) => {
      if (err) return reject(err);
      return resolve(files);
    });
  });
}

readFromConfig()
  .then((config) => {
    const args = minimist(process.argv.slice(2));
    if (args._.length === 0 && config.files.length < 1) {
      printUsage();
    }

    const requires = [].concat(args.require || []).concat([].concat(args.r || []));
    const processes = parseInt(args.processes || args.p || 4, 10);
    const files = args._;

    const filePromises = (files.length ? files : config.files)
      .map(promiseGlob)
      .reduce((acc, curr) => acc.concat(curr), []);
    return Promise.all(filePromises)
      .then((files) => files.reduce((acc, curr) => acc.concat(curr), []))
      .then((files) => ({
        requires: requires.length ? requires : config.requires,
        processes: processes.length ? processes : config.processes,
        files
      }));
  })
  .then(({ files, requires, processes }) => runner.run(files, requires, processes))
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


