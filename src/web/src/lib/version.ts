/**
 * Version information for the Anchor frontend
 * This gets updated automatically by build scripts
 */

export interface VersionInfo {
  version: string;
  buildDate: string;
  gitCommit: string;
  environment: string;
}

// This will be populated by the build process
declare const __APP_VERSION__: string | undefined;
declare const __BUILD_DATE__: string | undefined;
declare const __GIT_COMMIT__: string | undefined;

export const getVersionInfo = (): VersionInfo => {
  return {
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0',
    buildDate: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString(),
    gitCommit: typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'unknown',
    environment: process.env.NODE_ENV || 'development'
  };
};

export const VERSION_INFO = getVersionInfo();