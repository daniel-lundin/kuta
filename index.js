const minimist = require('minimist');

const runner = require('./lib/runner');

const ERR_USAGE = 0;

function printUsage() {
  console.log('Usage: kuta testfiles [options]');
  process.exit(ERR_USAGE);
}


const args = minimist(process.argv.slice(2));
if (args._.length < 1) {
  printUsage();
}

const files = args._;
runner.run(files)
  .then(results => {
    console.log('Test suite complete');
    console.log('Result:', results);
  });
