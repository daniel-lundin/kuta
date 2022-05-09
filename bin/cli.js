#!/usr/bin/env node

const path = require("path");
const minimist = require("minimist");
const colors = require("colors");
const glob = require("glob");
const fs = require("fs");
const os = require("os");

const runner = require(path.join(__dirname, "../src/runner"));
const logger = require(path.join(__dirname, "../src/logger"));
const utils = require(path.join(__dirname, "../src/utils"));
const processPool = require(path.join(__dirname, "../src/process-pool"));

const EXIT_CODE_OK = 0;
const EXIT_CODE_USAGE = 1;
const EXIT_CODE_FAILURES = 2;
const EXIT_CODE_STOPPED = 3;

const DEFAULT_TIMEOUT = 2000;
const DEFAULT_PROCESSES = os.cpus().length || 4;
const DEFAULT_REPORTER = "spec";

function readFromConfig() {
  return new Promise((resolve) => {
    fs.readFile("./package.json", (err, data) => {
      if (err) {
        return resolve({
          files: [],
        });
      }
      const config = JSON.parse(data);
      const kutaConfig = config.kuta || {};
      return resolve({
        files: kutaConfig.files || [],
        processes: kutaConfig.processes,
        timeout: kutaConfig.timeout,
        reporter: kutaConfig.reporter,
      });
    });
  });
}

function printStats(results) {
  const entries = Object.keys(results)
    .map((key) => results[key])
    // .sort((a, b) => b.time - a.time)
    .map((result) => [result.description, `${result.time}ms`, `${result.processIndex}`]);

  const maxWidths = entries.reduce(
    (acc, curr) => {
      return [
        Math.max(acc[0], curr[0].length + 1),
        Math.max(acc[1], curr[1].length + 1),
        Math.max(acc[2], curr[2].length + 1),
      ];
    },
    [0, 0, 0]
  );

  logger.logNoNL(colors.bold("File".padEnd(maxWidths[0])));
  logger.logNoNL(colors.bold("Time".padEnd(maxWidths[1])));
  logger.log(colors.bold("Process"));

  entries.forEach((result) => {
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
  logger.log("  -e, --errorSummary\t\tPrint a summary of failing tests after test run");
  logger.log("  -t, --timeout\t\t\tNumber of milliseconds before tests timeout");
  // logger.log('  -b, --bail \t\t\tExit on first failure');
  logger.log("      --global-setup \t\tPath to global setup module that exports an async function");
  logger.log("      --reporter \t\tOne of progres, spec, dot or future");
  logger.log("  -v, --version \t\tPrint version info");
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
  const filePromises = files.map(promiseGlob).reduce((acc, curr) => acc.concat(curr), []);

  return Promise.all(filePromises)
    .then((files) => files.reduce((acc, curr) => acc.concat(curr), []))
    .then((testFiles) => utils.scanForOnlys(testFiles).then((onlyMatches) => ({ testFiles, onlyMatches })));
}

async function startTests() {
  const config = await readFromConfig();
  const args = minimist(process.argv.slice(2));
  if (args._.length === 0 && config.files.length < 1) {
    printUsage();
  }

  const processes = parseInt(args.processes || args.p, 10);
  const timeout = args.timeout || args.t;
  const reporter = args.reporter;
  const bailMode = args.b || args.bail;
  const files = args._;
  const verbose = args.verbose;
  const printErrorSummary = args.e || args.errorSummary;

  const { testFiles, onlyMatches } = await getTestFiles(files.length ? files : config.files);
  const filteredFiles = testFiles.filter((file) => Object.keys(onlyMatches).includes(file));

  const runnerOptions = {
    matches: onlyMatches,
    processCount: processes || config.processes || process.env.KUTA_PROCESSES || DEFAULT_PROCESSES,
    timeout: timeout || config.timeout || process.env.KUTA_TIMEOUT || DEFAULT_TIMEOUT,
    reporterName: reporter || config.reporter || process.env.KUTA_REPORTER || DEFAULT_REPORTER,
    bailMode,
    verbose,
    printErrorSummary,
  };

  const filesToRun = Object.keys(onlyMatches).length ? filteredFiles : testFiles;
  logger.log(`Running ${filesToRun.length} test file(s) in ${runnerOptions.processCount} processes...\n`);

  const results = await runner.run(filesToRun, logger, runnerOptions);

  processPool.stopProcessPool();
  const failures = results.map(utils.summarizeResults).reduce((errors, curr) => errors + curr.errors, 0);
  if (verbose) {
    printStats(results);
  }
  if (failures > 0) {
    process.exit(EXIT_CODE_FAILURES);
  } else {
    process.exit(0);
  }

  return results;
}

function clearScreen() {
  logger.log("\x1Bc");
}

function runTests() {
  return startTests();
}

process.on("SIGINT", () => {
  logger.log("caught SIGINT, stopping child processes...");
  processPool.stopProcessPool();
  logger.log("child processes stopped, exit kuta");
  process.exit(EXIT_CODE_STOPPED);
});

if (require.main === module) {
  const args = minimist(process.argv.slice(2));
  if (args.h || args.help) {
    printUsage(EXIT_CODE_OK);
  }
  if (args.v || args.version) {
    printVersion();
  }
  readFromConfig().then(async () => {
    const globalSetup = args["global-setup"];
    if (globalSetup) {
      try {
        const setupModule = require(path.join(process.cwd(), globalSetup));
        await setupModule();
      } catch (error) {
        return logger.log(`${colors.bold(colors.red("Error:"))} Failed to run global setup. ${error}\n`);
      }
    }

    runTests();
  });
}

module.exports = {
  runTests,
  startTests,
  clearScreen,
};
