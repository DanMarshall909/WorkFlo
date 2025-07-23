/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'jest',
  testRunnerNodeArgs: ['--max_old_space_size=4096'],
  coverageAnalysis: 'perTest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  mutate: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/app/layout.tsx', // Exclude layout files from mutation
    '!src/app/globals.css', // Exclude global styles
    '!src/services/implementations/mock-*.{js,jsx,ts,tsx}', // Exclude mock services
    '!src/lib/api/**/*.{js,jsx,ts,tsx}', // Exclude generated API client
  ],
  thresholds: {
    high: 85,
    low: 80,
    break: 75,
  },
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  maxConcurrentTestRunners: 2,
  dashboard: {
    reportType: 'full',
  },
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  cleanTempDir: true,
  tempDirName: 'stryker-tmp',
  plugins: [
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker',
  ],
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  ignorePatterns: [
    '**/*.d.ts',
    '**/node_modules/**',
    '**/.next/**',
    '**/coverage/**',
    '**/dist/**',
    '**/build/**',
  ],
  mutationLevels: ['Complete'],
  incremental: true,
  incrementalFile: 'stryker-incremental.json',
};

export default config;