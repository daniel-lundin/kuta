const test = require('../../lib/kuta.js').test;
const assert = require('assert');

test('a simple failing test', () => {
  assert(false, 'we failed');
});

test('failing by rejecting', () => {
  return Promise.reject();
});

test('out of bounds rejections', (done) => {
  setTimeout(() => {
    assert(false);
    done();
  });
});

test('done with error', (done) => {
  setTimeout(() => done(new Error('')), 100);
});
