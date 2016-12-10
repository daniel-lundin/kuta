const tests = [];

function test(description, implementation) {
  tests.push({ description, implementation });
}

function listTests() {
  tests.forEach((test) => console.log(test.description));
}

function runTests() {
  tests.forEach(test => test.implementation());
}

module.exports = {
  test,
  listTests,
  runTests
};
