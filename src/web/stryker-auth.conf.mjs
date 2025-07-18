// Focused mutation testing configuration for auth components
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    config: {
      testMatch: ['**/__tests__/**/RegisterForm.test.tsx']
    }
  },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/components/auth/RegisterForm.tsx'
  ],
  thresholds: {
    high: 85,
    low: 80,
    break: 75,
  },
  htmlReporter: {
    fileName: 'reports/mutation/auth-mutation-report.html',
  },
  clearTextReporter: {
    allowConsoleColors: true,
    logTests: true,
    maxTestsToLog: 3,
  },
  disableTypeChecks: 'src/**/*.{js,jsx,ts,tsx}',
  tempDirName: 'stryker-tmp',
  plugins: [
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker'
  ],
  timeoutMS: 60000,
  timeoutFactor: 2,
};