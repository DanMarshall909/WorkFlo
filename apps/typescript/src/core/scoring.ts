// Functional scoring and gamification system

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { GameScores } from '../types/domain/scoring';
import { Result, Ok, Err } from '../types/core/result';

export const defaultScores: GameScores = {
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

export const parseScoresContent = (content: string): Partial<GameScores> => {
  const scores: any = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      scores[key] = Number(value) || 0;
    }
  });
  
  return scores;
};

export const loadScores = (scoreFile: string): Result<GameScores> => {
  try {
    if (!existsSync(scoreFile)) {
      return Ok({ ...defaultScores });
    }

    const content = readFileSync(scoreFile, 'utf8');
    const parsed = parseScoresContent(content);
    const merged = { ...defaultScores, ...parsed };
    
    return Ok(merged);
  } catch (error) {
    return Err(new Error(`Failed to load scores: ${error}`));
  }
};

export const formatScoresForSave = (scores: GameScores): string => {
  return Object.entries(scores)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
};

export const saveScores = (scoreFile: string, scores: GameScores): Result<void> => {
  try {
    const content = formatScoresForSave(scores);
    writeFileSync(scoreFile, content);
    return Ok(undefined);
  } catch (error) {
    return Err(new Error(`Failed to save scores: ${error}`));
  }
};

export const getTotalScore = (scores: GameScores): number => {
  return Math.round(
    (scores.PERFORMANCE_SCORE + 
     scores.QUALITY_SCORE + 
     scores.EFFICIENCY_SCORE + 
     scores.LLM_EFFICIENCY_SCORE) / 4
  );
};

// Performance score calculation
export const calculatePerformanceScore = (
  scores: GameScores, 
  testPassed: boolean, 
  testDurationMs: number
): GameScores => {
  const updatedScores = {
    ...scores,
    TEST_RUNS: scores.TEST_RUNS + 1,
    FAILED_RUNS: testPassed ? scores.FAILED_RUNS : scores.FAILED_RUNS + 1
  };

  const failureRate = updatedScores.TEST_RUNS > 0 
    ? (updatedScores.FAILED_RUNS * 100) / updatedScores.TEST_RUNS 
    : 0;
  
  const timePenalty = Math.floor(testDurationMs / 100); // Penalty for slow tests
  
  const performanceScore = Math.max(0, Math.min(100, 100 - failureRate - timePenalty));
  
  return {
    ...updatedScores,
    PERFORMANCE_SCORE: performanceScore
  };
};

// Quality score calculation  
export const countSourceLines = (): number => {
  try {
    if (existsSync('src')) {
      const linesOutput = execSync(
        'find src -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0',
        { encoding: 'utf8' }
      );
      return parseInt(linesOutput.trim()) || 0;
    } else {
      const linesOutput = execSync(
        'find . -maxdepth 2 -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | grep -v node_modules | grep -v test | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0',
        { encoding: 'utf8' }
      );
      return parseInt(linesOutput.trim()) || 0;
    }
  } catch {
    return 0;
  }
};

export const calculateQualityScore = (scores: GameScores, criteria: number): GameScores => {
  const currentLines = countSourceLines();
  const linesPerCriteria = criteria > 0 ? currentLines / criteria : currentLines;
  const complexityPenalty = Math.floor(linesPerCriteria / 50); // Penalty for verbose implementations
  
  const qualityScore = Math.max(0, Math.min(100, 100 - complexityPenalty));
  
  return {
    ...scores,
    QUALITY_SCORE: qualityScore,
    TOTAL_LINES: currentLines
  };
};

// Efficiency score calculation
export const countTests = (): number => {
  try {
    if (existsSync('test') || existsSync('tests') || existsSync('src/test')) {
      const testsOutput = execSync(
        'find . -name "*.test.*" -o -name "*.spec.*" -o -name "*.bats" | xargs grep -c "test\\|it\\|should" 2>/dev/null | awk \'{sum+=$1} END {print sum+0}\'',
        { encoding: 'utf8' }
      );
      return parseInt(testsOutput.trim()) || 0;
    }
  } catch {
    return 0;
  }
  return 0;
};

export const calculateEfficiencyScore = (scores: GameScores, criteria: number): GameScores => {
  const currentTests = countTests();
  const testsPerCriteria = criteria > 0 ? currentTests / criteria : currentTests;
  
  let efficiencyBonus = 0;
  
  // Bonus for having exactly the right number of tests
  if (testsPerCriteria >= 1 && testsPerCriteria <= 3) {
    efficiencyBonus = 20;
  } else if (testsPerCriteria >= 4 && testsPerCriteria <= 6) {
    efficiencyBonus = 10;
  }
  
  const efficiencyPenalty = testsPerCriteria > 6 ? (testsPerCriteria - 6) * 5 : 0;
  
  const efficiencyScore = Math.max(0, Math.min(100, 80 + efficiencyBonus - efficiencyPenalty));
  
  return {
    ...scores,
    EFFICIENCY_SCORE: efficiencyScore,
    TOTAL_TESTS: currentTests
  };
};

// LLM efficiency score calculation
export const calculateLlmEfficiencyScore = (
  scores: GameScores, 
  outputTokens: number, 
  phase: string
): GameScores => {
  const updatedScores = {
    ...scores,
    LLM_INTERACTIONS: scores.LLM_INTERACTIONS + 1,
    ESTIMATED_TOKENS: scores.ESTIMATED_TOKENS + outputTokens
  };
  
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
  
  const llmEfficiencyScore = Math.max(0, Math.min(100, verbosityScore));
  
  return {
    ...updatedScores,
    LLM_EFFICIENCY_SCORE: llmEfficiencyScore
  };
};

// Display functions
export const displayScores = (scores: GameScores): void => {
  const totalScore = getTotalScore(scores);
  
  console.log('');
  console.log('🎮 GAMIFICATION SCORES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⚡ Performance: ${scores.PERFORMANCE_SCORE}/100 (test speed & reliability)`);
  console.log(`🎯 Code Quality: ${scores.QUALITY_SCORE}/100 (minimal, clean implementation)`);
  console.log(`🧪 Test Efficiency: ${scores.EFFICIENCY_SCORE}/100 (optimal test coverage)`);
  console.log(`🤖 LLM Efficiency: ${scores.LLM_EFFICIENCY_SCORE}/100 (output verbosity optimization)`);
  console.log(`📊 Overall Score: ${totalScore}/100`);
  console.log('');
  console.log(`📈 Metrics: ${scores.TOTAL_TESTS} tests, ${scores.TOTAL_LINES} lines, ${scores.TEST_RUNS} runs`);
  console.log(`🔤 Script Output: ${scores.LLM_INTERACTIONS} commands, ~${scores.ESTIMATED_TOKENS} output tokens`);
  console.log('');
};

// Functional composition helpers
export const updateScores = (
  scoreFile: string,
  updateFn: (scores: GameScores) => GameScores
) => (): Result<GameScores> => {
  const loadResult = loadScores(scoreFile);
  if (!loadResult.success) return loadResult;
  
  const updatedScores = updateFn(loadResult.data);
  const saveResult = saveScores(scoreFile, updatedScores);
  
  return saveResult.success ? Ok(updatedScores) : saveResult;
};

export const withPerformanceTracking = (
  scoreFile: string,
  testPassed: boolean,
  testDurationMs: number
) => updateScores(scoreFile, scores => 
  calculatePerformanceScore(scores, testPassed, testDurationMs)
);

export const withQualityTracking = (
  scoreFile: string,
  criteria: number
) => updateScores(scoreFile, scores => 
  calculateQualityScore(scores, criteria)
);

export const withEfficiencyTracking = (
  scoreFile: string,
  criteria: number
) => updateScores(scoreFile, scores => 
  calculateEfficiencyScore(scores, criteria)
);

export const withLlmTracking = (
  scoreFile: string,
  outputTokens: number,
  phase: string
) => updateScores(scoreFile, scores => 
  calculateLlmEfficiencyScore(scores, outputTokens, phase)
);

export const estimateTokenUsage = (output: string): number => {
  // Rough estimation: ~4 characters per token
  return Math.ceil(output.length / 4);
};