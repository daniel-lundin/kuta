const test = require("../../src/kuta.js").test;

test("slow test", () => new Promise(resolve => setTimeout(resolve, 1000)));
