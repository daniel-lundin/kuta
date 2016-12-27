module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es6': true
  },
  'globals': {
    'process': true,
    '__dirname': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ]
  }
};
