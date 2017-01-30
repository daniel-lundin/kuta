'use strict';

module.exports.log = function(...args) {
  console.log(...args); // eslint-disable-line no-console
};

module.exports.logNoNL = function(str) {
  process.stdout.write(str);
};
