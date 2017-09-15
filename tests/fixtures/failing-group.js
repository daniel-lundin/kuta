const test = require('../../lib/kuta.js').test;

test('a top level test', () => {
});

test.group('grouped tests', (t) => {
  t.before(() => {
    throw new Error('');
  });

  t('inner test 1', () => {
  });

  t('inner test 2', () => {
  });
});
