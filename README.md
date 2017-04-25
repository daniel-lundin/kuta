# kuta
[![Build Status](https://travis-ci.org/daniel-lundin/kuta.svg?branch=master)](https://travis-ci.org/daniel-lundin/kuta)
[![Code Climate](https://codeclimate.com/github/daniel-lundin/kuta/badges/gpa.svg)](https://codeclimate.com/github/daniel-lundin/kuta)

Experimental parallel test runner for node (very much WIP)

`npm install kuta`

# Design goals

- Fast execution times by running tests in parallel
- Agnostic towards assertion libraries, as long as exceptions are thrown.
- Small API, few features, little configuration

# Implementation details

- Run each test file in it's own process, but recycle processes through a process pool.

# Trade-offs

Since test files are executed one by one, there is no step that scans all files before the runner starts.

 - No TAP support
 - no support for adding mocha-style .only on tests(see matching instead)
 - Processes are reused which means that test clean up has to be done for each test. If one test "leaks" into another it can be hard to debug since it is not deterministic which process will run which test.

# Usage

## Writing tests

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

```

## Running tests

Tests are run with the kuta command:

```
  Usage: kuta [options] testfiles

  Options:
   -r, --require            Files to require before running tests
   -p, --processes          Number of processes in the process pool
   -t, --timeout            Number of milliseconds before tests timeout
   -m, --match              Run only test that match this string
   -w, --watch [dir1,dir2]  Directories to watch for changes and re-run tests
```


Example:

`kuta tests/**/*.js`

## Test matching

By using the `--match` option, kuta will only run test that match the string provided. If a group is matched, all its tests will run as well. If a single test within a group is matched, all lifecycle hooks in outer groups will run as well.

## Configuration

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

## Babel

If you transpile with babel, use the babel-register hook:

`kuta tests/**/*.js --require babel-register`

## Parallel processes

Since processes are run in parallel, test that spawn servers on specific port will run into problems where one test process has already a port to be used by another test. To overcome this, kuta sends a environment variable with an index to each of the process that can be used to generate unique ports for different processes.

The environment variable is `KUTA_PROCESS_INDEX`

# Mocha compatibility

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

## Mocha cakes

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

# Extras

BDD syntax add-on for writing test in given-when-then style:

```js

import { feature } from 'kuta/lib/bdd';

feature('a feature', (scenario) => {
  scenario('a scenario', ({ given, when, then }) => {
    given('something given', () => {
      // Some setup
    });

    when('something happens', () => {
     // Some acting
    });

    then('something is expected', () => {
     // Some expecting
    });
  });
});
```

Also included is a Jasmine-like DSL:

```js

import { describe } from 'kuta/lib/bdd';

describe('outer describe', (it) => {
  it.before(() => {
    // Will run before all inner describes
  });

  it.after(() => {
    // Will run after all inner describes
  });

  it.describe('inner describe', (it) => {
    it('some test', () => {
      // test setup
    });
  });
});
```
