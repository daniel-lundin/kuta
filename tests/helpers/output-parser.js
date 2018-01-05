function parsePassed(stdout) {
  let match;
  const regex = /Passed.*(\d)/g;
  const matches = [];
  while ((match = regex.exec(stdout))) matches.push(match); // eslint-disable-line
  return parseInt(matches[matches.length - 1][1], 10);
}

function parseFailed(stdout) {
  let match;
  const regex = /Failed.*(\d)/g;
  const matches = [];
  while ((match = regex.exec(stdout))) matches.push(match); // eslint-disable-line
  return parseInt(matches[matches.length - 1][1], 10);
}

function parseResult(stdout) {
  return {
    failedCount: parseFailed(stdout),
    passedCount: parsePassed(stdout)
  };
}

module.exports = {
  parseResult
};
