const test = require('../lib/kuta.js').test;
const assert = require('assert');

test('a simple test 1', () => {
  return new Promise((resolve) => {
    assert(true);
    setTimeout(resolve, 1);
  });
});

test('another simple test 1', () => {
  assert(true);
});

test.group('simple group', (t) => {
  t('group test 1', () => {
    assert(true);
  });

  t('group test 2', () => {
    assert(true);
  });
});
