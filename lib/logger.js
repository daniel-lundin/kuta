"use strict";

const cliCursor = require("cli-cursor");

module.exports = {
  log(...args) {
    console.log(...args); // eslint-disable-line no-console
  },
  logNoNL(str) {
    process.stdout.write(str);
  },
  hideCursor() {
    cliCursor.hide();
  },
  showCursor() {
    cliCursor.show();
  }
};
