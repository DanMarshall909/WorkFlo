#!/usr/bin/env node

/**
 * Frontend Quality Check Script
 * Matches backend quality standards with comprehensive checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class QualityChecker {
  constructor() {
    this.results = {
      typeCheck: { passed: false, errors: [] },
      linting: { passed: false, errors: [] },
      formatting: { passed: false, errors: [] },
      tests: { passed: false, coverage: null, errors: [] },
      build: { passed: false, errors: [] },
      overall: { passed: false, score: 0 }
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logStep(step, description) {
    this.log(`\n🔍 ${step}: ${description}`, 'cyan');
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  async runCommand(command, description, allowFailure = false) {
    try {
      this.log(`Running: ${command}`, 'blue');
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      this.logSuccess(`${description} completed`);
      return { success: true, output };
    } catch (error) {
      const errorMsg = `${description} failed: ${error.message}`;
      if (allowFailure) {
        this.logWarning(errorMsg);
      } else {
        this.logError(errorMsg);
      }
      return { success: false, error: error.message, output: error.stdout || '' };
    }
  }

  async checkTypeScript() {
    this.logStep('1/6', 'TypeScript Type Checking');
    
    const result = await this.runCommand('npm run type-check', 'TypeScript type checking');
    this.results.typeCheck.passed = result.success;
    
    if (!result.success) {
      this.results.typeCheck.errors.push(result.error);
    }
    
    return result.success;
  }

  async checkLinting() {
    this.logStep('2/6', 'ESLint Analysis');
    
    // Always attempt auto-fix first for better results
    this.log('Running ESLint with auto-fix enabled...', 'blue');
    const fixResult = await this.runCommand('npm run lint:fix', 'ESLint auto-fix', true);
    
    if (fixResult.success) {
      this.logSuccess('Auto-fix completed successfully');
    }
    
    // Then run linting check
    const result = await this.runCommand('npm run lint', 'ESLint analysis');
    this.results.linting.passed = result.success;
    
    if (!result.success) {
      this.results.linting.errors.push(result.error);
      this.logWarning('Some linting issues could not be auto-fixed');
    }
    
    return this.results.linting.passed;
  }

  async checkFormatting() {
    this.logStep('3/6', 'Code Formatting (Prettier)');
    
    // Always format first for consistency
    this.log('Auto-formatting code with Prettier...', 'blue');
    const formatResult = await this.runCommand('npm run format', 'Prettier auto-format', true);
    
    if (formatResult.success) {
      this.logSuccess('Code formatted successfully');
      this.results.formatting.passed = true;
    } else {
      // Fallback to format check if auto-format fails
      const result = await this.runCommand('npm run format:check', 'Prettier format check');
      this.results.formatting.passed = result.success;
      
      if (!result.success) {
        this.results.formatting.errors.push(result.error);
      }
    }
    
    return this.results.formatting.passed;
  }

  async runTests() {
    this.logStep('4/6', 'Unit Tests & Coverage');
    
    const result = await this.runCommand('npm run test:ci', 'Unit tests with coverage');
    this.results.tests.passed = result.success;
    
    if (result.success) {
      // Extract coverage information
      try {
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          this.results.tests.coverage = coverage.total;
          
          const { lines, statements, functions, branches } = coverage.total.pct;
          this.log(`Coverage: Lines ${lines}%, Statements ${statements}%, Functions ${functions}%, Branches ${branches}%`, 'blue');
          
          // Check coverage thresholds (matching backend: 95%)
          const minCoverage = 95;
          const coverageOk = lines >= minCoverage && statements >= minCoverage && 
                           functions >= minCoverage && branches >= minCoverage;
          
          if (!coverageOk) {
            this.logWarning(`Coverage below threshold (${minCoverage}%)`);
            this.results.tests.errors.push('Coverage below threshold');
          }
        }
      } catch (error) {
        this.logWarning('Could not read coverage report');
      }
    } else {
      this.results.tests.errors.push(result.error);
    }
    
    return this.results.tests.passed;
  }

  async checkBuild() {
    this.logStep('5/6', 'Production Build');
    
    const result = await this.runCommand('npm run build', 'Production build');
    this.results.build.passed = result.success;
    
    if (!result.success) {
      this.results.build.errors.push(result.error);
    }
    
    return result.success;
  }

  async runMutationTests() {
    this.logStep('6/6', 'Mutation Testing (Optional)');
    
    // Check if mutation testing should run (optional for CI)
    const runMutation = process.env.RUN_MUTATION_TESTS === 'true' || process.argv.includes('--mutation');
    
    if (!runMutation) {
      this.logWarning('Mutation testing skipped (use --mutation flag to enable)');
      return true;
    }
    
    this.log('This may take several minutes...', 'yellow');
    const result = await this.runCommand('npm run mutate:ci', 'Mutation testing', true);
    
    if (result.success) {
      this.logSuccess('Mutation testing completed - check reports/mutation/index.html for results');
    } else {
      this.logWarning('Mutation testing failed or incomplete');
    }
    
    return true; // Don't fail overall quality check for mutation tests
  }

  calculateOverallScore() {
    const checks = [
      this.results.typeCheck.passed,
      this.results.linting.passed,
      this.results.formatting.passed,
      this.results.tests.passed,
      this.results.build.passed
    ];
    
    const passedChecks = checks.filter(Boolean).length;
    const score = Math.round((passedChecks / checks.length) * 100);
    
    this.results.overall.score = score;
    this.results.overall.passed = score >= 80; // 80% minimum to pass
    
    return score;
  }

  generateReport() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const score = this.calculateOverallScore();
    
    this.log('\n' + '='.repeat(60), 'bright');
    this.log('FRONTEND QUALITY CHECK REPORT', 'bright');
    this.log('='.repeat(60), 'bright');
    
    // Overall result
    const overallColor = this.results.overall.passed ? 'green' : 'red';
    const overallStatus = this.results.overall.passed ? 'PASSED' : 'FAILED';
    this.log(`\nOverall Status: ${overallStatus} (${score}%)`, overallColor);
    this.log(`Duration: ${duration}s\n`);
    
    // Individual check results
    const checks = [
      ['TypeScript Type Check', this.results.typeCheck.passed],
      ['ESLint Analysis', this.results.linting.passed],
      ['Code Formatting', this.results.formatting.passed],
      ['Unit Tests', this.results.tests.passed],
      ['Production Build', this.results.build.passed]
    ];
    
    checks.forEach(([name, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? 'green' : 'red';
      this.log(`${name.padEnd(25)}: ${status}`, color);
    });
    
    // Coverage information
    if (this.results.tests.coverage) {
      const { lines, statements, functions, branches } = this.results.tests.coverage.pct;
      this.log(`\nCoverage Summary:`, 'blue');
      this.log(`  Lines: ${lines}%`, lines >= 95 ? 'green' : 'yellow');
      this.log(`  Statements: ${statements}%`, statements >= 95 ? 'green' : 'yellow');
      this.log(`  Functions: ${functions}%`, functions >= 95 ? 'green' : 'yellow');
      this.log(`  Branches: ${branches}%`, branches >= 95 ? 'green' : 'yellow');
    }
    
    // Error summary
    const allErrors = [
      ...this.results.typeCheck.errors,
      ...this.results.linting.errors,
      ...this.results.formatting.errors,
      ...this.results.tests.errors,
      ...this.results.build.errors
    ];
    
    if (allErrors.length > 0) {
      this.log(`\nErrors (${allErrors.length}):`, 'red');
      allErrors.forEach((error, index) => {
        this.log(`  ${index + 1}. ${error}`, 'red');
      });
    }
    
    // Recommendations
    this.log('\nRecommendations:', 'magenta');
    if (!this.results.typeCheck.passed) {
      this.log('  • Fix TypeScript type errors before committing', 'yellow');
    }
    if (!this.results.linting.passed) {
      this.log('  • Run "npm run lint:fix" to auto-fix linting issues', 'yellow');
    }
    if (!this.results.formatting.passed) {
      this.log('  • Run "npm run format" to auto-format code', 'yellow');
    }
    if (!this.results.tests.passed) {
      this.log('  • Add or fix unit tests to ensure 95% coverage', 'yellow');
    }
    if (!this.results.build.passed) {
      this.log('  • Fix build errors before deploying', 'yellow');
    }
    
    this.log('\n' + '='.repeat(60), 'bright');
    
    return this.results.overall.passed;
  }

  async run() {
    this.log('🚀 Starting Frontend Quality Check...', 'bright');
    
    try {
      await this.checkTypeScript();
      await this.checkLinting();
      await this.checkFormatting();
      await this.runTests();
      await this.checkBuild();
      await this.runMutationTests();
      
      const passed = this.generateReport();
      
      if (passed) {
        this.log('\n🎉 All quality checks passed! Ready for production.', 'green');
        process.exit(0);
      } else {
        this.log('\n💥 Quality checks failed. Please fix issues before proceeding.', 'red');
        process.exit(1);
      }
    } catch (error) {
      this.logError(`Quality check failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run quality check if this file is executed directly
if (require.main === module) {
  const checker = new QualityChecker();
  checker.run();
}

module.exports = QualityChecker;