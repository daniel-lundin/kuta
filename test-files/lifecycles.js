const assert = require('assert');
const test = require('../lib/kuta.js').test;


test.group('grouped tests', (t) => {
  const order = [];
  t.before(() => {
    order.push(1);
  });

  t.after(() => {
    assert.deepEqual(order, [1, 2, 3, 4]);
  });

  t.beforeEach(() => {
    order.push(2);
  });

  t.afterEach(() => {
    order.push(4);
  });

  t('actual test', () => {
    order.push(3);
  });
});

