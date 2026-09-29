/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'smart'],
    'prefer-const': 'warn',
  },
  overrides: [
    {
      files: ['scripts/*.mjs'],
      env: { node: true },
      rules: { 'no-console': 'off' },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', 'public/frames*'],
};
