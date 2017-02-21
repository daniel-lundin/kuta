'use strict';
const { test } = require('./kuta');
const colors = require('colors');

const groupStack = [test];

const noop = () => {};

function label(keyword) {
  return `${colors.bold(keyword)}`;
}

function topGroup() {
  return groupStack[groupStack.length - 1];
}

// describe, it
module.exports.describe = (description, definition) => {
  groupStack.push(topGroup().group(description, noop));
  definition();
  groupStack.pop();
};

module.exports.it = (description, callback) => {
  topGroup()(description, callback);
};

// Mocha cakes
const groupAliases = ['Feature', 'Scenario'];
const groupExports = groupAliases.reduce((acc, alias) =>
  Object.assign(acc, {
    [alias]: (description, groupDefinition) => {
      groupStack.push(topGroup().group(`${label(alias)}: ${description}`, noop));
      groupDefinition();
      groupStack.pop();
    }
  }),
  {}
);
Object.assign(module.exports, groupExports);

const testAliases = ['Given', 'When', 'And', 'Then', 'But'];
const aliasExports = testAliases.reduce((acc, alias) =>
  Object.assign(acc, {
    [alias]: (description, callback) =>
      topGroup()(`${label(alias)}: ${description}`, callback)
  }),
  {}
);
Object.assign(module.exports, aliasExports);

const lifeCycles = ['before', 'beforeEach', 'after', 'afterEach']; 
const lifeCyclesExport = lifeCycles.reduce((acc, lifeCycle) =>
  Object.assign(acc, {
    [lifeCycle]: (callback) => topGroup()[lifeCycle](callback)
  }),
  {}
);
Object.assign(module.exports, lifeCyclesExport);
