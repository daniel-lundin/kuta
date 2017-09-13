const assert = require('assert');

const kuta = require('../lib/kuta');
const { scanForOnlys } = require('../lib/utils');

kuta.test('should extract test names with .only', () => {
  const filename = './test-files/file-with-onlys.js';

  return scanForOnlys([filename])
    .then((result) => {
      assert.equal(result[filename].length, 4);
      assert.equal(result[filename][0], 'has only'); 
      assert.equal(result[filename][1], 'also has only'); 
      assert.equal(result[filename][2], 'however this should run'); 
      assert.equal(result[filename][3], 'group with only'); 
    });
});
