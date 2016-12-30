const test = require('../lib/kuta.js').test;

test('a top level test', () => {
  console.log('this should run');
});

test.group('grouped tests', (t) => {
  t.before(() => {
    throw new Error('');
  });

  t('should never run', () => {
    console.log('are we running?');
  });

  t('and neither should this', () => {
    console.log('are we running? 2 2 2 2 2 2 2 2 2 2');
  });
});
