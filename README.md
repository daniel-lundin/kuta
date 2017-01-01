# kuta
[![Build Status](https://travis-ci.org/daniel-lundin/kuta.svg?branch=master)](https://travis-ci.org/daniel-lundin/kuta)
[![Code Climate](https://codeclimate.com/github/daniel-lundin/kuta/badges/gpa.svg)](https://codeclimate.com/github/daniel-lundin/kuta)

Experimental parallel test runner for node (very much WIP)

`npm install kuta`

# Design goals

- Fast execution times by running test files in parallel
- Agnostic towards assertion libraries, as long as exceptions are thrown.
- Small API, few features, little configuration

# Implementation details

- Run each test file in it's own process, but recycle processes through a process pool.

# Trade-offs

Since test files are read one by one, there is no easy way to get a holistic view of the test suite. Specifically: it will be hard to support TAP output and running only one specific test(with .only e.g.)
Processes are recycled which means that test clean up has to be done for each test. If one test "leaks" into another it can be hard to debug since it is not deterministic which process will run which test.

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
```

## Running tests

Tests are run with the kuta command:

```
  Usage: kuta [options] testfiles');

  Options:
   -r, --require    files to require before running tests
   -p, --processes  Number of processes in the process pool
   -t, --timeout    Number of milliseconds before tests timeout
```


Example:

`kuta tests/**/*.js`


Kuta looks for a `kuta`-section in package.json where options can be defined. CLI arguments take precendence over package.json config.

Example:

```json
{
  "name": "my-app",
  "kuta": {
    "requires": ["testSetup.js", "babel-register"],
    "files": ["tests/*.js"],
    "processes": 8,
    "timeout": 1000
  },
}
```

## Babel

If you transpile with babel, use the babel-register hook:

`kuta tests/**/*.js --require babel-register`

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
