// ESLint configuration enforcing TYPESCRIPT_BEST_PRACTICES.md
const { ESLint } = require('eslint');

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      // CRITICAL: Enforce TypeScript best practices from TYPESCRIPT_BEST_PRACTICES.md
      
      // NEVER use 'any' type - this is our #1 rule
      '@typescript-eslint/no-explicit-any': 'error',
      
      // Type safety rules
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      
      // CLI-specific rules
      'no-console': 'off', // CLI tools need console output
      'no-process-exit': 'off', // CLI tools need process.exit
      
      // General code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },
  {
    // More relaxed rules for test files
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.js'],
  },
];