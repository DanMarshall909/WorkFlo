import { existsSync, readFileSync, writeFileSync } from 'fs';

export interface GameScores {
  PERFORMANCE_SCORE: number;
  QUALITY_SCORE: number;
  EFFICIENCY_SCORE: number;
  LLM_EFFICIENCY_SCORE: number;
  TOTAL_TESTS: number;
  TOTAL_LINES: number;
  TEST_RUNS: number;
  FAILED_RUNS: number;
  LLM_INTERACTIONS: number;
  ESTIMATED_TOKENS: number;
}

export class ScoreManager {
  private readonly scoreFile: string;
  private scores: GameScores;

  private readonly defaultScores: GameScores = {
    PERFORMANCE_SCORE: 100,
    QUALITY_SCORE: 100,
    EFFICIENCY_SCORE: 100,
    LLM_EFFICIENCY_SCORE: 100,
    TOTAL_TESTS: 0,
    TOTAL_LINES: 0,
    TEST_RUNS: 0,
    FAILED_RUNS: 0,
    LLM_INTERACTIONS: 0,
    ESTIMATED_TOKENS: 0
  };

  constructor(scoreFile: string = '.tdd-scores') {
    this.scoreFile = scoreFile;
    this.scores = this.loadScores();
  }

  getScores(): GameScores {
    return { ...this.scores };
  }

  getTotalScore(): number {
    return Math.round(
      (this.scores.PERFORMANCE_SCORE + 
       this.scores.QUALITY_SCORE + 
       this.scores.EFFICIENCY_SCORE + 
       this.scores.LLM_EFFICIENCY_SCORE) / 4
    );
  }

  calculatePerformanceScore(testPassed: boolean, testDurationMs: number): void {
    if (testPassed) {
      this.scores.TEST_RUNS++;
    } else {
      this.scores.FAILED_RUNS++;
      this.scores.TEST_RUNS++;
    }

    const failureRate = this.scores.TEST_RUNS > 0 
      ? (this.scores.FAILED_RUNS * 100) / this.scores.TEST_RUNS 
      : 0;
    
    const timePenalty = Math.floor(testDurationMs / 100); // Penalty for slow tests
    
    this.scores.PERFORMANCE_SCORE = Math.max(0, Math.min(100, 100 - failureRate - timePenalty));
  }

  calculateQualityScore(criteria: number): void {
    let currentLines = 0;
    
    try {
      // Count source code lines (exclude test files and generated files)
      const { execSync } = require('child_process');
      
      if (existsSync('src')) {
        const linesOutput = execSync(
          'find src -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0',
          { encoding: 'utf8' }
        );
        currentLines = parseInt(linesOutput.trim()) || 0;
      } else {
        const linesOutput = execSync(
          'find . -maxdepth 2 -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | grep -v node_modules | grep -v test | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0',
          { encoding: 'utf8' }
        );
        currentLines = parseInt(linesOutput.trim()) || 0;
      }
    } catch {
      currentLines = 0;
    }

    const linesPerCriteria = criteria > 0 ? currentLines / criteria : currentLines;
    const complexityPenalty = Math.floor(linesPerCriteria / 50); // Penalty for verbose implementations
    
    this.scores.QUALITY_SCORE = Math.max(0, Math.min(100, 100 - complexityPenalty));
    this.scores.TOTAL_LINES = currentLines;
  }

  calculateEfficiencyScore(criteria: number): void {
    let currentTests = 0;
    
    try {
      const { execSync } = require('child_process');
      
      if (existsSync('test') || existsSync('tests') || existsSync('src/test')) {
        const testsOutput = execSync(
          'find . -name "*.test.*" -o -name "*.spec.*" -o -name "*.bats" | xargs grep -c "test\\|it\\|should" 2>/dev/null | awk \'{sum+=$1} END {print sum+0}\'',
          { encoding: 'utf8' }
        );
        currentTests = parseInt(testsOutput.trim()) || 0;
      }
    } catch {
      currentTests = 0;
    }

    const testsPerCriteria = criteria > 0 ? currentTests / criteria : currentTests;
    let efficiencyBonus = 0;
    
    // Bonus for having exactly the right number of tests
    if (testsPerCriteria >= 1 && testsPerCriteria <= 3) {
      efficiencyBonus = 20;
    } else if (testsPerCriteria >= 4 && testsPerCriteria <= 6) {
      efficiencyBonus = 10;
    }
    
    const efficiencyPenalty = testsPerCriteria > 6 ? (testsPerCriteria - 6) * 5 : 0;
    
    this.scores.EFFICIENCY_SCORE = Math.max(0, Math.min(100, 80 + efficiencyBonus - efficiencyPenalty));
    this.scores.TOTAL_TESTS = currentTests;
  }

  calculateLlmEfficiencyScore(outputTokens: number, phase: string): void {
    this.scores.LLM_INTERACTIONS++;
    this.scores.ESTIMATED_TOKENS += outputTokens;
    
    // Phase-specific verbosity penalties
    let verbosityPenalty = 0;
    switch (phase) {
      case 'RED':
      case 'GREEN':
        if (outputTokens > 200) {
          verbosityPenalty = outputTokens - 200;
        }
        break;
      case 'COVER':
        if (outputTokens > 500) {
          verbosityPenalty = Math.floor((outputTokens - 500) / 2);
        }
        break;
      default:
        if (outputTokens > 300) {
          verbosityPenalty = Math.floor((outputTokens - 300) / 3);
        }
        break;
    }
    
    let verbosityScore = 100;
    if (verbosityPenalty > 0) {
      verbosityScore = 100 - Math.floor(verbosityPenalty / 10);
    }
    
    // Bonus for extremely concise output
    if (outputTokens < 100) {
      verbosityScore += 20;
    }
    
    this.scores.LLM_EFFICIENCY_SCORE = Math.max(0, Math.min(100, verbosityScore));
  }

  save(): void {
    const scoresContent = Object.entries(this.scores)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
      
    writeFileSync(this.scoreFile, scoresContent);
  }

  reset(): void {
    this.scores = { ...this.defaultScores };
    this.save();
  }

  private loadScores(): GameScores {
    if (!existsSync(this.scoreFile)) {
      return { ...this.defaultScores };
    }

    try {
      const scoresContent = readFileSync(this.scoreFile, 'utf8');
      const scores: any = {};
      
      scoresContent.split('\n').forEach(line => {
        const match = line.match(/^(\w+)=(.+)$/);
        if (match) {
          const [, key, value] = match;
          scores[key] = Number(value) || 0;
        }
      });
      
      // Merge with defaults to ensure all fields exist
      return { ...this.defaultScores, ...scores };
    } catch {
      return { ...this.defaultScores };
    }
  }

  displayScores(): void {
    const totalScore = this.getTotalScore();
    
    console.log('');
    console.log('🎮 GAMIFICATION SCORES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⚡ Performance: ${this.scores.PERFORMANCE_SCORE}/100 (test speed & reliability)`);
    console.log(`🎯 Code Quality: ${this.scores.QUALITY_SCORE}/100 (minimal, clean implementation)`);
    console.log(`🧪 Test Efficiency: ${this.scores.EFFICIENCY_SCORE}/100 (optimal test coverage)`);
    console.log(`🤖 LLM Efficiency: ${this.scores.LLM_EFFICIENCY_SCORE}/100 (output verbosity optimization)`);
    console.log(`📊 Overall Score: ${totalScore}/100`);
    console.log('');
    console.log(`📈 Metrics: ${this.scores.TOTAL_TESTS} tests, ${this.scores.TOTAL_LINES} lines, ${this.scores.TEST_RUNS} runs`);
    console.log(`🔤 Script Output: ${this.scores.LLM_INTERACTIONS} commands, ~${this.scores.ESTIMATED_TOKENS} output tokens`);
    console.log('');
  }
}