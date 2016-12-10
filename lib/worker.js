const test = require('./main.js');
const path = require('path');

console.log('child started');

process.on('message', m => {
  console.log('got message', m);
  require(path.join('../', m));
  test.listTests();
});

setTimeout(() => {
  console.log('time to go');
  process.exit();
}, 2000);

