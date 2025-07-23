/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  testRunnerNodeArgs: ['--max_old_space_size=4096'],
  coverageAnalysis: 'perTest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  mutate: [
    'src/lib/types/session.ts',
  ],
  thresholds: {
    high: 85,
    low: 80,
    break: 75,
  },
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  concurrency: 2,
  htmlReporter: {
    fileName: 'reports/mutation-session/index.html',
  },
  cleanTempDir: true,
  tempDirName: 'stryker-session-tmp',
  plugins: [
    '@stryker-mutator/jest-runner',
  ],
  ignorePatterns: [
    '**/*.d.ts',
    '**/node_modules/**',
    '**/.next/**',
    '**/coverage/**',
    '**/dist/**',
    '**/build/**',
  ],
  disableTypeChecks: false,
};

export default config;