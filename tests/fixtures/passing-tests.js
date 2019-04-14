const test = require("../../src/kuta.js").test;
const assert = require("assert");

test("simple", () => {});

test("returning resolved promise", () => {
  return Promise.resolve();
});

test("calling done", done => {
  setTimeout(done, 100);
});
