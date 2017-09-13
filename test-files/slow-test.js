const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('slow test', () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
});
