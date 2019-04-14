const { test } = require("../../src/kuta");

test("throws delayed exception", () => {
  console.log("running test");
  setTimeout(() => {
    throw new Error("outside test");
  }, 500);
});
