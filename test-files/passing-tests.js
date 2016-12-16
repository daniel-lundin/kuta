const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('a simple test 1', () => {
  return new Promise((resolve) => {
    assert(true);
    setTimeout(resolve, 200);
  });
});

test('another simple test 1', () => {
  assert(true);
});

