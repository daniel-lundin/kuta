<img src="https://github.com/daniel-lundin/kuta/raw/master/assets/kuta-logo.png" width=200>

# kuta

[![Build Status](https://travis-ci.org/daniel-lundin/kuta.svg?branch=master)](https://travis-ci.org/daniel-lundin/kuta)
[![npm version](https://badge.fury.io/js/kuta.svg)](https://badge.fury.io/js/kuta)

Experimental parallel test runner for node

`npm install kuta`

## Introduction

Tests should run fast. This is an attempt at a parallel test runner for node. Parallellism is achieved by starting a number of processes and feeding them test-files. As soon as one process is done running a test file it will be given a new one.

## Design goals

- Fast execution times by running tests in parallel
- Agnostic towards assertion libraries, as long as exceptions are thrown or promises returned.
- Small API, few features, little configuration

## Trade-offs

 - No TAP support(files are run one by one, so total number of tests are unknown)
 - Processes are reused which means that test clean up has to be done for each test. If one test "leaks" into another it can be hard to debug since it is not deterministic which process will run which test.

## Usage

### Writing tests

```js
import { test } from 'kuta';

test.before(() => {
  // Some setup
});

test.after(() => {
  // Some tear down
});

test.beforeEach(() => {
  // Will run before each test
});

test.afterEach(() => {
  // Will run after each test
});

// Synchronous test
test('it should work', () => {
  assert(true);
});

// Asynchronous test (return a promise)
test('it should work', () => {
  return fetch('http://url.se')
    .then((response) => {
      assert(response.ok);
    });
});

//  Grouped tests
test.group('a group', (t) => {
  t.before(() => {
    // Will run before tests in group
  });

  t.after(() => {
    // Will run after tests in group
  });

  t('a test in this group', () => {});
});


// Only running some tests
test.only('will only run this test', () => {
});

test.only('and this since it also has only', () => {
});


// Skipped tests
test.skip('this will not run', () => {
});

test.group.skip('nor will this group', (t) => {
  t('or any tests withing it', () => {
  });
});

```

### Running tests

Tests are run with the `kuta` command:

```
  Usage: kuta [options] testfiles

  Options:
   -r, --require            Files to require before running tests
   -p, --processes          Number of processes in the process pool
   -t, --timeout            Number of milliseconds before tests timeout
       --reporter           progress or spec(default)
   -w, --watch [dir1,dir2]  Directories to watch for changes and re-run tests
```


Example:

`kuta tests/**/*.js`

### Configuration

Kuta looks for a `kuta`-section in package.json where options can be defined. CLI arguments take precendence over package.json config.

Example package.json:

```json
{
  "name": "my-app",
  "kuta": {
    "requires": ["testSetup.js", "babel-register"],
    "files": ["tests/*.js"],
    "processes": 8,
    "watch": "lib/,common",
    "timeout": 1000
  },
}
```

### Babel

If you transpile with babel, use the babel-register hook:

`kuta tests/**/*.js --require babel-register`

### Parallel processes

Since processes are run in parallel, test that spawn services on specific port will run into problems where two processes try to allocate the same port. To overcome this, kuta sends an environment variable with an index to each of the processs that can be used to generate unique ports for different processes.

The environment variable is `KUTA_PROCESS_INDEX`

## Mocha compatibility

Kuta includes a mocha and mocha-cakes compatability layer:

```js

import { describe, it } from 'kuta/lib/mocha-compat';

describe('mocha style', () => {
  before(() => {});
  after(() => {});

  it('should work', () => {
    describe('inner group', () => {
    });
  });
});
```

### Mocha cakes

```js

import { Feature, Scenario, Given, When, Then, But } from 'kuta/lib/mocha-compat';

Feature('Feature', () => {
  Scenario('', () => {
    Given('a given', () => {});

    When('something happens', () => {});

    Then('something is expected', () => {});

    And('another thing should be expected', () => {});

    But('not this thing', () => {});
  });
});
```

## Licence

MIT Copyright Daniel Lundin
