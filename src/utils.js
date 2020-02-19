"use strict";

const Fgets = require("qfgets");
const common = require("./common");

function arrayParam(longArg, shortArg) {
  return [].concat(longArg || []).concat([].concat(shortArg || []));
}

function summarizeResults(group) {
  const errors = group.results.filter(
    test => test.result === common.TEST_FAILURE
  );
  const successes = group.results.filter(
    test => test.result === common.TEST_SUCCESS
  );

  return group.groups.reduce(
    (acc, group) => {
      const groupResult = summarizeResults(group);
      return {
        errors: acc.errors + groupResult.errors,
        successes: acc.successes + groupResult.successes,
        errorDetails: [...acc.errorDetails, ...groupResult.errorDetails]
      };
    },
    { errors: errors.length, successes: successes.length, errorDetails: errors  }
  );
}

function extractTests(group, predicate) {
  const tests = group.results
    .filter(predicate)
    .map(test => Object.assign({}, test, { parentGroup: group }));
  return tests.concat(
    ...group.groups.map(g =>
      extractFailingTests(Object.assign({}, g, { parentGroup: group }))
    )
  );
}

function extractPendingTests(group) {
  const isPending = test => test.result === common.TEST_PENDING;
  return extractTests(group, isPending);
}

function extractFailingTests(group) {
  const isFailing = test => test.result === common.TEST_FAILURE;
  return extractTests(group, isFailing);
}

const onlyRegEx = /\.only\(["'](.*)["'],/;

function scanFileForOnly(filename) {
  return new Promise((resolve, reject) => {
    const fp = new Fgets(filename);
    const result = {
      filename,
      onlyTitles: []
    };

    fp.processLines(
      (line, cb) => {
        const match = line.match(onlyRegEx);
        if (match) {
          result.onlyTitles.push(match[1]);
        }
        cb();
      },
      err => {
        if (err) return reject(err);
        return resolve(result);
      }
    );
  });
}

function scanForOnlys(filenames) {
  return Promise.all(
    filenames.map(filename => {
      return scanFileForOnly(filename);
    })
  ).then(results => {
    return results.reduce((acc, curr) => {
      if (curr.onlyTitles.length === 0) {
        return acc;
      }
      return Object.assign({}, acc, {
        [curr.filename]: curr.onlyTitles
      });
    }, {});
  });
}

module.exports = {
  arrayParam,
  scanForOnlys,
  summarizeResults,
  extractPendingTests,
  extractFailingTests
};
