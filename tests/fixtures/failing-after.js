const test = require("../../src/kuta.js").test;

test("a top level test", () => {});

test.group("grouped tests", (t) => {
  t.after(() => {
    throw new Error("");
  });

  t("inner test 1", () => {});

  t("inner test 2", () => {});
});
