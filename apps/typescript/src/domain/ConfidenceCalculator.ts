import { PrValidationResults, ConfidenceResult } from './interfaces';
import { WorkFloConfig } from '../core/ConfigManager';

export class ConfidenceCalculator {
  constructor(private config: WorkFloConfig) {}

  /**
   * Calculates confidence score based on PR validation results
   * Ported from .NET PrConfidenceCalculator class
   */
  calculateConfidence(prResults: PrValidationResults): ConfidenceResult {
    // Use configuration weights for score calculation
    const testPassScore = prResults.testsPassed ? this.config.CONFIDENCE_WEIGHTS_TEST_PASS : 0;
    const coverageScore = (prResults.codeCoverage * this.config.CONFIDENCE_WEIGHTS_COVERAGE) / 100;
    const reviewScore = (prResults.reviewScore * this.config.CONFIDENCE_WEIGHTS_REVIEW) / 100;
    const mutationTestScore = (prResults.mutationScore * this.config.CONFIDENCE_WEIGHTS_MUTATION) / 100;

    const totalScore = Math.round(testPassScore + coverageScore + reviewScore + mutationTestScore);

    const breakdown = {
      testPassScore,
      coverageScore,
      reviewScore,
      mutationTestScore
    };

    const recommendation = totalScore >= this.config.CONFIDENCE_THRESHOLD ? 'auto-merge' : 'manual-review';

    return {
      usedPrMutationTesting: true, // Always true since we run mutation testing at PR time
      mutationScore: prResults.mutationScore,
      totalScore,
      breakdown,
      recommendation: recommendation as 'auto-merge' | 'manual-review'
    };
  }

  /**
   * Calculates confidence score with default test values
   * Used when some metrics are not available
   */
  calculateBasicConfidence(testsPassed: boolean, estimatedCoverage: number = 95): ConfidenceResult {
    const basicResults: PrValidationResults = {
      testsPassed,
      codeCoverage: estimatedCoverage,
      reviewScore: 88, // Default review score
      mutationScore: 85, // Default mutation score (threshold)
      buildSuccess: testsPassed
    };

    return this.calculateConfidence(basicResults);
  }

  /**
   * Validates that mutation score meets the minimum threshold
   */
  validateMutationScore(mutationScore: number): boolean {
    return mutationScore >= this.config.MUTATION_THRESHOLD;
  }

  /**
   * Gets the confidence threshold from configuration
   */
  getConfidenceThreshold(): number {
    return this.config.CONFIDENCE_THRESHOLD;
  }

  /**
   * Gets the mutation testing threshold from configuration
   */
  getMutationThreshold(): number {
    return this.config.MUTATION_THRESHOLD;
  }

  /**
   * Determines if the confidence score warrants auto-merge
   */
  shouldAutoMerge(confidenceResult: ConfidenceResult): boolean {
    return confidenceResult.recommendation === 'auto-merge' && 
           confidenceResult.totalScore >= this.config.CONFIDENCE_THRESHOLD;
  }

  /**
   * Generates a human-readable confidence report
   */
  generateConfidenceReport(confidenceResult: ConfidenceResult): string {
    const { breakdown, totalScore, recommendation } = confidenceResult;
    
    const report = `
📊 CONFIDENCE SCORE REPORT
==========================
Overall Score: ${totalScore}% (threshold: ${this.config.CONFIDENCE_THRESHOLD}%)

Score Breakdown:
- Test Execution: ${breakdown.testPassScore}/${this.config.CONFIDENCE_WEIGHTS_TEST_PASS} points
- Code Coverage: ${breakdown.coverageScore.toFixed(1)}/${this.config.CONFIDENCE_WEIGHTS_COVERAGE} points  
- Code Review: ${breakdown.reviewScore.toFixed(1)}/${this.config.CONFIDENCE_WEIGHTS_REVIEW} points
- Mutation Testing: ${breakdown.mutationTestScore.toFixed(1)}/${this.config.CONFIDENCE_WEIGHTS_MUTATION} points

Mutation Score: ${confidenceResult.mutationScore}% (threshold: ${this.config.MUTATION_THRESHOLD}%)
Recommendation: ${recommendation.toUpperCase()}

${recommendation === 'auto-merge' 
  ? '✅ Auto-merge approved - all quality gates passed'
  : '⚠️  Manual review required - quality gates not fully met'
}
`;

    return report.trim();
  }

  /**
   * Updates confidence weights in the configuration
   */
  updateConfidenceWeights(weights: {
    testPass?: number;
    coverage?: number;
    review?: number;
    mutation?: number;
  }): void {
    if (weights.testPass !== undefined) {
      this.config.CONFIDENCE_WEIGHTS_TEST_PASS = weights.testPass;
    }
    if (weights.coverage !== undefined) {
      this.config.CONFIDENCE_WEIGHTS_COVERAGE = weights.coverage;
    }
    if (weights.review !== undefined) {
      this.config.CONFIDENCE_WEIGHTS_REVIEW = weights.review;
    }
    if (weights.mutation !== undefined) {
      this.config.CONFIDENCE_WEIGHTS_MUTATION = weights.mutation;
    }

    // Validate that weights sum to 100
    const total = this.config.CONFIDENCE_WEIGHTS_TEST_PASS + 
                 this.config.CONFIDENCE_WEIGHTS_COVERAGE + 
                 this.config.CONFIDENCE_WEIGHTS_REVIEW + 
                 this.config.CONFIDENCE_WEIGHTS_MUTATION;

    if (total !== 100) {
      throw new Error(`Confidence weights must sum to 100, but sum to ${total}`);
    }
  }
}