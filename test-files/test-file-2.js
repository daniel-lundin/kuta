const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('a simple test 2', () => {
  assert(true);
});

test('another simple test 2', () => {
  assert(false, 'Something went wrong in test-file2.js');
});
