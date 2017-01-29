'use strict';

function arrayParam(longArg, shortArg) {
  return [].concat(longArg || []).concat([].concat(shortArg || []));
}

module.exports = {
  arrayParam
};

