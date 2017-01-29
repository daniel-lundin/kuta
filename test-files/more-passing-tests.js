const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('a simple test 2', () => {
  return new Promise((resolve) => {
    assert(true);
    setTimeout(resolve, 1);
  });
});

test('another simple test 2', () => {
  assert(true);
});

