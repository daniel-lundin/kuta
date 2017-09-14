const test = require('../lib/kuta.js').test;

test('slow test', () =>
  new Promise((resolve) =>
    setTimeout(resolve, 1000)));
