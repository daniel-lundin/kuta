const assert = require('assert');

const test = require('../lib/kuta.js').test;
const kutaAsEmitter = require('./helpers/process-emitter').kutaAsEmitter;

test('should run bdd-style tests', () => {
  const kutaEmitter = kutaAsEmitter(['test-files/bdd-file.js']);

  return kutaEmitter.waitForCompletedRun()
    .then(() => {
      assert.equal(kutaEmitter.passes(), 3);
    });
});

test('should run jasmine-style tests', () => {
  const kutaEmitter = kutaAsEmitter(['test-files/jasmine-dsl.js']);

  return kutaEmitter.waitForCompletedRun()
    .then(() => {
      assert.equal(kutaEmitter.passes(), 4);
    });
});

test('should run mocha-style tests', () => {
  const kutaEmitter = kutaAsEmitter(['test-files/mocha-test.js']);

  return kutaEmitter.waitForCompletedRun()
    .then(() => {
      assert.equal(kutaEmitter.passes(), 8);
      assert.equal(kutaEmitter.failures(), 0);
    });
});
