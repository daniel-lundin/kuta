const assert = require('assert');

const kuta = require('../lib/kuta');
const { scanForOnlys } = require('../lib/utils');

kuta.test('should extract test names with .only', () => {
  return scanForOnlys(['./test-files/file-with-onlys.js'])
    .then((result) => {
      assert.equal(result.length, 4);
      assert.equal(result[0], 'has only'); 
      assert.equal(result[1], 'also has only'); 
      assert.equal(result[1], 'group with only'); 
    });
});
