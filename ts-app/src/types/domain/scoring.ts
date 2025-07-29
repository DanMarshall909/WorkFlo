// Gamification scoring types

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