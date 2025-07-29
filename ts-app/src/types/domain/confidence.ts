// Confidence scoring types

export interface PrValidationResults {
  testsPassed: boolean;
  codeCoverage: number;
  reviewScore: number;
  mutationScore: number;
  buildSuccess: boolean;
}

export interface ConfidenceResult {
  usedPrMutationTesting: boolean;
  mutationScore: number;
  totalScore: number;
  breakdown: {
    testPassScore: number;
    coverageScore: number;
    reviewScore: number;
    mutationTestScore: number;
  };
  recommendation: 'auto-merge' | 'manual-review';
}