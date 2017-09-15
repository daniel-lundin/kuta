const test = require('../../lib/kuta.js').test;

test('slow test 1', () =>
  new Promise((resolve) =>
    setTimeout(resolve, 1000)));

test('slow test 2', () =>
  new Promise((resolve) =>
    setTimeout(resolve, 1000)));

test('slow test 2', () =>
  new Promise((resolve) =>
    setTimeout(resolve, 1000)));
