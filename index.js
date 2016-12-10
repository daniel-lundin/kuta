const glob = require('glob');
const minimist = require('minimist');
const path = require('path');
const fork = require('child_process').fork;

const test = require('./lib/main.js');

const ERR_USAGE = 0;
const ERR_FILES = 1;

function printUsage() {
  console.log('Usage: kuta testfiles [options]');
  process.exit(ERR_USAGE);
}


const args = minimist(process.argv.slice(2));
if (args._.length !== 1) {
  printUsage();
}

const filePattern = args._[0];

glob(filePattern, (err, files) => {
  if(err) {
    process.exit(ERR_FILES);
  }

  console.log(files);
  const children = files.map(file => {
    const child = fork('./lib/worker.js');
    child.send(file);
    return child;
  });

  children.forEach(child => {
    child.on('close', () => {
      console.log('child closed');
    });
  });
});
