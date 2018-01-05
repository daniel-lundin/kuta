const assert = require("assert");
const test = require("../../lib/kuta.js").test;

test("not only", () => {
  throw new Error("nooooo");
});

test.only("has only", () => {});

test.only("also has only", () => {});

test.group("a group without only", t => {
  t("this should not run", () => {
    throw new Error("nooooo");
  });

  t.only("however this should run", () => {});
});

test.group("outer group", outerGroup => {
  let beforeRun = false;

  outerGroup.before(() => {
    beforeRun = true;
  });

  outerGroup.group("inner group", t => {
    t.only("inner group test", () => {
      assert(beforeRun);
    });
  });
});

test.group.only("group with only", t => {
  t("this should run", () => {});
  t("this should run as well", () => {});
});
