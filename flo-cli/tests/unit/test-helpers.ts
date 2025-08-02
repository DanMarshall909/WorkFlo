/**
 * Test helpers for unit testing oclif commands
 */

import { Config } from '@oclif/core';

/**
 * Creates a minimal mock Config object for testing oclif commands
 */
export function createMockConfig(): Partial<Config> {
  return {
    bin: 'flo',
    version: '1.0.0',
    name: 'flo-cli',
    root: process.cwd(),
    userAgent: 'flo-cli/1.0.0',
    debug: false,
    npmRegistry: 'https://registry.npmjs.org',
    shell: process.env.SHELL || '/bin/sh',
    windows: process.platform === 'win32',
    arch: process.arch as any,
    platform: process.platform as any,
    cacheDir: '/tmp/flo-cli-cache',
    dataDir: '/tmp/flo-cli-data',
    configDir: '/tmp/flo-cli-config',
    dirname: 'flo',
    errlog: '/tmp/flo-cli-error.log',
    home: process.env.HOME || '/tmp',
    options: {},
    pjson: {
      name: 'flo-cli',
      version: '1.0.0',
      oclif: {
        bin: 'flo',
        dirname: 'flo',
        commands: './dist/commands'
      }
    } as any,
    plugins: new Map(),
    topics: [],
    commands: new Map(),
    commandIDs: [],
    flexibleTaxonomy: false,
    topicSeparator: ':',
    valid: true
  } as Config;
}

/**
 * Mock process.exit to prevent tests from actually exiting
 */
export function mockProcessExit(): jest.SpyInstance {
  return jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('Process.exit called');
  });
}