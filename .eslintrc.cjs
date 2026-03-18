/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    'out',
    '*.cjs',
    '*.config.js',
    '*.config.ts',
  ],
  overrides: [
    {
      files: ['apps/*/**/*.{ts,tsx}'],
      extends: ['next/core-web-vitals', 'next/typescript'],
    },
  ],
  settings: {
    react: { version: 'detect' },
  },
};
