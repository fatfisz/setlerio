'use strict';

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'prettier', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['import', 'prettier', '@typescript-eslint'],
  rules: {
    'no-prototype-builtins': 'off',
    'no-sparse-arrays': 'off',
    'no-useless-rename': 'warn',
    'object-shorthand': 'warn',
    'sort-imports': [
      'warn',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
    strict: 'warn',

    'import/extensions': 'warn',
    'import/first': 'warn',
    'import/newline-after-import': 'warn',
    'import/no-default-export': 'warn',
    'import/no-duplicates': 'warn',
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    'prettier/prettier': [
      'warn',
      {
        printWidth: 100,
        singleQuote: true,
        trailingComma: 'all',
      },
    ],

    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
  overrides: [
    {
      files: ['**/*.js'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['rollup.config.js', 'rollup-plugins/**'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};
