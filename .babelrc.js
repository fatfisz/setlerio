'use strict';

module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: [
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    'babel-plugin-preval',
  ],
};
