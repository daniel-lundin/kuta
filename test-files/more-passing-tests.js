const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('async test', () => {
  return new Promise((resolve) => {
    assert(true);
    setTimeout(resolve, 200);
  });
});

test('simple sync test', () => {
  assert(true);
});

