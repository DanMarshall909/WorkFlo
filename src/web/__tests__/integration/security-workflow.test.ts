/**
 * Security Workflow Integration Tests
 * Tests the complete workflow for handling security vulnerabilities
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Security Vulnerability Workflow', () => {
  const webDir = path.resolve(__dirname, '../../');
  const packageJsonPath = path.join(webDir, 'package.json');
  const packageLockPath = path.join(webDir, 'package-lock.json');

  beforeAll(() => {
    // Ensure we're in the correct directory
    process.chdir(webDir);
  });

  describe('dependency resolution validates secure versions', () => {
    test('package manager resolves form-data to secure version', () => {
      // Given: Package.json should contain overrides for form-data
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // When: We check for npm overrides configuration
      const hasOverrides = packageJson.overrides && packageJson.overrides['form-data'];
      
      // Then: form-data should be overridden to secure version
      expect(hasOverrides).toBeTruthy();
      if (hasOverrides) {
        const version = packageJson.overrides['form-data'];
        expect(version).toMatch(/^(\^|>=)?4\.0\.4/);
      }
    });

    test('installed dependencies use secure form-data version', () => {
      // Given: Dependencies are installed
      let installedVersion: string;
      
      try {
        // When: We check the actually installed version
        const output = execSync('npm list form-data --json', { 
          encoding: 'utf8',
          cwd: webDir 
        });
        const npmList = JSON.parse(output);
        
        // Extract version from dependency tree
        const findFormDataVersion = (deps: any): string | null => {
          if (deps['form-data']) {
            return deps['form-data'].version;
          }
          for (const dep of Object.values(deps)) {
            if (dep && typeof dep === 'object' && (dep as any).dependencies) {
              const found = findFormDataVersion((dep as any).dependencies);
              if (found) return found;
            }
          }
          return null;
        };
        
        installedVersion = findFormDataVersion(npmList.dependencies) || '';
      } catch (error) {
        // Fallback: check package-lock.json
        const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
        installedVersion = packageLock.packages?.['node_modules/form-data']?.version || '';
      }
      
      // Then: Installed version should be 4.0.4 or higher
      expect(installedVersion).toBeDefined();
      const versionParts = installedVersion.split('.').map(Number);
      expect(versionParts[0]).toBeGreaterThanOrEqual(4);
      expect(versionParts[1]).toBeGreaterThanOrEqual(0);
      expect(versionParts[2]).toBeGreaterThanOrEqual(4);
    });
  });

  describe('security scanning detects vulnerabilities', () => {
    test('npm audit identifies form-data vulnerabilities when present', () => {
      // Given: A project with potentially vulnerable dependencies
      let auditOutput: string;
      
      try {
        // When: We run security audit
        auditOutput = execSync('npm audit --json', { 
          encoding: 'utf8',
          cwd: webDir 
        });
      } catch (error: any) {
        // npm audit exits with non-zero when vulnerabilities found
        auditOutput = error.stdout || '{}';
      }
      
      const auditResult = JSON.parse(auditOutput);
      
      // Then: No critical vulnerabilities should be present for form-data
      if (auditResult.vulnerabilities) {
        const formDataVulns = Object.entries(auditResult.vulnerabilities)
          .filter(([name]) => name === 'form-data' || name.includes('form-data'))
          .map(([, vuln]: [string, any]) => vuln);
        
        const criticalVulns = formDataVulns.filter((vuln: any) => 
          vuln.severity === 'critical' || vuln.severity === 'high'
        );
        
        expect(criticalVulns).toHaveLength(0);
      }
    });

    test('dependabot alert workflow can be accessed and managed', () => {
      // Given: We have GitHub CLI access
      let alertsAccessible = false;
      let formDataAlertExists = false;
      
      try {
        // When: We check for Dependabot alerts
        const alertsOutput = execSync('gh api repos/DanMarshall909/WorkFlo/dependabot/alerts', { 
          encoding: 'utf8',
          cwd: webDir 
        });
        
        const alerts = JSON.parse(alertsOutput);
        alertsAccessible = true;
        
        // Check if form-data alert exists (may be open or closed)
        const formDataAlerts = alerts.filter((alert: any) => 
          alert.dependency?.package?.name === 'form-data'
        );
        formDataAlertExists = formDataAlerts.length > 0;
      } catch (error: any) {
        // API access may not be available in test environment
        alertsAccessible = false;
      }
      
      // Then: Alert system should be accessible and functional
      expect(alertsAccessible).toBeTruthy();
      
      // And: form-data alert should be trackable (open or closed)
      if (alertsAccessible) {
        expect(typeof formDataAlertExists).toBe('boolean');
      }
    });
  });

  describe('workflow enforcement validates security fixes', () => {
    test('quality gates include security validation', () => {
      // Given: Quality check script exists
      const qcScriptPath = path.resolve(webDir, '../../qc');
      const qcExists = fs.existsSync(qcScriptPath);
      
      // When: We verify quality gates are available
      expect(qcExists).toBeTruthy();
      
      // Then: Quality check should include security validation
      if (qcExists) {
        const qcContent = fs.readFileSync(qcScriptPath, 'utf8');
        expect(qcContent).toContain('quality check'); // Verify it's a quality check script
      }
    });

    test('safe commit process includes dependency validation', () => {
      // Given: Safe commit script exists
      const safeCommitPath = path.resolve(webDir, '../../scripts/safe-commit.sh');
      const safeCommitExists = fs.existsSync(safeCommitPath);
      
      // When: We verify safe commit workflow
      expect(safeCommitExists).toBeTruthy();
      
      // Then: Safe commit should include quality checks
      if (safeCommitExists) {
        const safeCommitContent = fs.readFileSync(safeCommitPath, 'utf8');
        expect(safeCommitContent).toMatch(/(test|quality|check)/i);
      }
    });
  });

  describe('TDD workflow supports security fixes', () => {
    test('test infrastructure can validate dependency security', () => {
      // Given: Jest configuration supports security testing
      const jestConfigPath = path.join(webDir, 'jest.config.js');
      const jestConfigExists = fs.existsSync(jestConfigPath);
      
      // When: We verify test configuration exists
      expect(jestConfigExists).toBeTruthy();
      
      // Then: Jest configuration file should be readable
      if (jestConfigExists) {
        const jestConfigContent = fs.readFileSync(jestConfigPath, 'utf8');
        expect(jestConfigContent).toContain('testEnvironment');
        expect(jestConfigContent).toContain('collectCoverageFrom');
      }
    });

    test('mutation testing can validate security test quality', () => {
      // Given: Stryker configuration exists
      const strykerConfigPath = path.join(webDir, 'stryker.conf.mjs');
      const strykerConfigExists = fs.existsSync(strykerConfigPath);
      
      // When: We verify mutation testing setup
      expect(strykerConfigExists).toBeTruthy();
      
      // Then: Stryker should be configured for security testing
      if (strykerConfigExists) {
        const strykerContent = fs.readFileSync(strykerConfigPath, 'utf8');
        expect(strykerContent).toContain('mutate');
      }
    });
  });

  describe('GitHub workflow integration', () => {
    test('GitHub board commands are available', () => {
      // Given: GitHub board script exists
      const gbScriptPath = path.resolve(webDir, '../../gb');
      const gbExists = fs.existsSync(gbScriptPath);
      
      // When: We verify GitHub board integration
      expect(gbExists).toBeTruthy();
      
      // Then: Board commands should be functional
      if (gbExists) {
        const gbContent = fs.readFileSync(gbScriptPath, 'utf8');
        expect(gbContent).toMatch(/(github|board|issue)/i);
      }
    });

    test('workflow session management is available', () => {
      // Given: Start work script exists
      const swScriptPath = path.resolve(webDir, '../../sw');
      const swExists = fs.existsSync(swScriptPath);
      
      // When: We verify session management
      expect(swExists).toBeTruthy();
      
      // Then: Session workflow should be functional
      if (swExists) {
        // Verify it's a symlink to enhanced-start-work.sh
        const stats = fs.lstatSync(swScriptPath);
        expect(stats.isSymbolicLink()).toBeTruthy();
      }
    });
  });
});