#!/usr/bin/env node

const path = require("path");
const minimist = require("minimist");
const colors = require("colors");
const glob = require("glob");
const fs = require("fs");
const os = require("os");

const runner = require(path.join(__dirname, "../lib/runner"));
const logger = require(path.join(__dirname, "../lib/logger"));
const utils = require(path.join(__dirname, "../lib/utils"));
const common = require(path.join(__dirname, "../lib/common"));
const processPool = require(path.join(__dirname, "../lib/process-pool"));

const EXIT_CODE_OK = 0;
const EXIT_CODE_USAGE = 1;
const EXIT_CODE_FAILURES = 2;

const DEFAULT_TIMEOUT = 2000;

function readFromConfig() {
  return new Promise(resolve => {
    fs.readFile("./package.json", (err, data) => {
      if (err) {
        return resolve({
          processes: 4,
          requires: [],
          files: [],
          watch: "",
          reporter: "spec"
        });
      }
      const config = JSON.parse(data);
      const kutaConfig = config.kuta || {};
      return resolve({
        processes: kutaConfig.processes || os.cpus().length,
        requires: kutaConfig.requires || [],
        files: kutaConfig.files || [],
        timeout: kutaConfig.timeout || DEFAULT_TIMEOUT,
        watch: kutaConfig.watch || "",
        reporter: kutaConfig.reporter || "spec"
      });
    });
  });
}

function printStats(results) {
  const entries = Object.keys(results)
    .map(key => results[key])
    // .sort((a, b) => b.time - a.time)
    .map(result => [
      result.description,
      `${result.time}ms`,
      `${result.processIndex}`
    ]);

  const maxWidths = entries.reduce(
    (acc, curr) => {
      return [
        Math.max(acc[0], curr[0].length + 1),
        Math.max(acc[1], curr[1].length + 1),
        Math.max(acc[2], curr[2].length + 1)
      ];
    },
    [0, 0, 0]
  );

  logger.logNoNL(colors.bold("File".padEnd(maxWidths[0])));
  logger.logNoNL(colors.bold("Time".padEnd(maxWidths[1])));
  logger.log(colors.bold("Process"));

  entries.forEach(result => {
    logger.logNoNL(result[0].padEnd(maxWidths[0]));
    logger.logNoNL(result[1].padEnd(maxWidths[1]));
    logger.log(result[2].padEnd(maxWidths[2]));
  });
  logger.log("");
}

function printUsage(exitCode = EXIT_CODE_USAGE) {
  logger.log("");
  logger.log("  Usage: kuta [options] testfiles");
  logger.log("");
  logger.log(" Options: ");
  logger.log("");
  logger.log("  -r, --require\t\t\tfiles to require before running tests");
  logger.log("  -p, --processes\t\tNumber of processes in the process pool");
  logger.log(
    "  -t, --timeout\t\t\tNumber of milliseconds before tests timeout"
  );
  logger.log(
    "  -w, --watch [dir1,dir2]\tDirectories to watch for changes and re-run tests"
  );
  // logger.log('  -b, --bail \t\t\tExit on first failure');
  logger.log("  -v, --version \t\t\tPrint version info");
  logger.log("  -h, --help \t\t\tPrint this help");
  logger.log("");
  process.exit(exitCode);
}

function printVersion() {
  const pkg = require(path.join(__dirname, "../package.json"));
  logger.log(`Version: ${colors.bold(pkg.version)}`);
  logger.log("");
  logger.log("© 2018 Daniel Lundin");
  process.exit(0);
}

function promiseGlob(globPattern) {
  return new Promise((resolve, reject) => {
    glob(globPattern, (err, files) => {
      if (err) return reject(err);
      return resolve(files);
    });
  });
}

async function getTestFiles(files) {
  const filePromises = files
    .map(promiseGlob)
    .reduce((acc, curr) => acc.concat(curr), []);

  return Promise.all(filePromises)
    .then(files => files.reduce((acc, curr) => acc.concat(curr), []))
    .then(testFiles =>
      utils
        .scanForOnlys(testFiles)
        .then(onlyMatches => ({ testFiles, onlyMatches }))
    );
}

async function startTests(watchMode) {
  const config = await readFromConfig();
  const args = minimist(process.argv.slice(2));
  if (args._.length === 0 && config.files.length < 1) {
    printUsage();
  }

  const requires = utils.arrayParam(args.require, args.r);
  const processes = parseInt(args.processes || args.p, 10);
  const timeout = args.timeout || args.t;
  const reporter = args.reporter;
  const bailMode = args.b || args.bail;
  const files = args._;
  const verbose = args.verbose;

  const { testFiles, onlyMatches } = await getTestFiles(
    files.length ? files : config.files
  );
  const filteredFiles = testFiles.filter(file =>
    Object.keys(onlyMatches).includes(file)
  );

  const runnerOptions = {
    requires: requires.length ? requires : config.requires,
    matches: onlyMatches,
    processCount: processes || config.processes,
    timeout: timeout ? timeout : config.timeout,
    reporterName: reporter || config.reporter,
    bailMode,
    verbose
  };

  const filesToRun = Object.keys(onlyMatches).length
    ? filteredFiles
    : testFiles;
  logger.log(
    `Running ${filesToRun.length} test file(s) in ${
      runnerOptions.processCount
    } processes...\n`
  );

  const results = await runner.run(filesToRun, logger, runnerOptions);

  if (!watchMode) {
    processPool.stopProcessPool();
    const failures = results
      .map(utils.summarizeResults)
      .reduce((errors, curr) => errors + curr.errors, 0);
    if (verbose) {
      printStats(results);
    }
    if (failures > 0) {
      process.exit(EXIT_CODE_FAILURES);
    } else {
      process.exit(0);
    }
  }

  return results;
}

function clearScreen() {
  logger.log("\x1Bc");
}

let testInProgress = false;
let testsQueued = false;

function runTests(watchMode) {
  testInProgress = true;
  startTests(watchMode)
    .then(() => {
      testInProgress = false;

      if (watchMode) {
        if (testsQueued) {
          runTests(watchMode);
          testsQueued = false;
        } else {
          logger.log("");
          logger.log("Waiting for file changes...");
        }
      }
    })
    .catch(err => {
      if (err !== common.ABORT_EXIT_CODE) {
        throw err;
      }
    });
}

function startWatch(dirs) {
  function throttle(fn, delay) {
    let lastCall = null;

    return function() {
      const now = Date.now();
      if (!lastCall || now - lastCall > delay) {
        fn();
      }
      lastCall = now;
    };
  }

  function _triggerNewRun() {
    if (testInProgress) {
      testsQueued = true;
      processPool.broadcast(common.stopTests());
    } else {
      clearScreen();
      runTests(true);
    }
  }

  const triggerNewRun = throttle(_triggerNewRun, 250);

  dirs.forEach(dir => {
    const watchOpts = {
      recursive: true
    };
    fs.watch(dir, watchOpts, triggerNewRun);
  });
}

if (require.main === module) {
  const args = minimist(process.argv.slice(2));
  if (args.h || args.help) {
    printUsage(EXIT_CODE_OK);
  }
  if (args.v || args.version) {
    printVersion();
  }
  readFromConfig().then(config => {
    const watch = args.w || args.watch || config.watch || "";
    if (typeof watch !== "string") {
      return logger.log(
        `${colors.bold(
          colors.yellow("Warning:")
        )} watch parameter must be a comma-sperated string\n`
      );
    }
    const watchMode = watch.length > 1;
    if (watchMode) {
      startWatch(watch.split(","));
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
