const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('a simple failing test', () => {
  assert(false, 'we failed');
});
