const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('pass if run from with process index 1', () => {
  const processIndex = parseInt(process.env.KUTA_PROCESS_INDEX, 10);
  assert.equal(processIndex, 1);
});
