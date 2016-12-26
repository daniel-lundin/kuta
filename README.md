# kuta
[![Build Status](https://travis-ci.org/daniel-lundin/kuta.svg?branch=master)](https://travis-ci.org/daniel-lundin/kuta)

Parallel test runner for node (very much WIP)

`npm install kuta`

# Design philosophy

- Run each test file in it's own process, but recycle processes through a process pool.
- Agnostic towards assertion libraries, as long as exceptions are thrown.
- Keep options configuration at bare minimum.

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
```


Example:

`kuta tests/**/*.js`

## Babel

If you transpile with babel, use the babel-register hook:

`kuta tests/**/*.js --require babel-register`

# Extras

BDD syntax add on for writing test in given-when-then style:

```js

import feature from 'kuta/lib/bdd';

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
