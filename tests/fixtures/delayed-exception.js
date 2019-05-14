const { test } = require("../../src/kuta");

test("throws out of bounds exception", () => {
  console.log("running test");
  setTimeout(() => {
    throw new Error("outside test");
  }, 0);

  return new Promise(resolve => setTimeout(resolve, 100));
});
