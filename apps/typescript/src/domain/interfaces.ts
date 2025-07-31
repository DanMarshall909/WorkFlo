// Core domain interfaces

export interface TddSession {
  issue: string;
  criteria: number;
  phase: TddPhase;
  total: number;
  startTime: Date;
}

export type TddPhase = 'START' | 'RED' | 'GREEN' | 'REFACTOR' | 'COVER';

export interface WorkflowViolation {
  description: string;
  phase?: TddPhase;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface WorkflowDetectionResult {
  violationDetected: boolean;
  violationMessage: string;
  correctedActions: string[];
  suggestions?: string[];
}

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

export interface CoverPhaseResult {
  mutationTestingExecuted: boolean;
  message: string;
  coverageScore?: number;
}

export interface ProjectInfo {
  type: ProjectType;
  hasRunTests: boolean;
  testCommand?: string;
  buildCommand?: string;
}

export type ProjectType = 'bash' | 'nodejs' | 'dotnet';

// Exceptions
export class WorkFloError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WorkFloError';
  }
}

export class ClaudeMdNotReadException extends WorkFloError {
  constructor(message: string = 'CLAUDE.md must be read before starting TDD workflow') {
    super(message, 'CLAUDE_MD_NOT_READ');
    this.name = 'ClaudeMdNotReadException';
  }
}

export class WorkflowViolationException extends WorkFloError {
  constructor(message: string, public violation: WorkflowViolation) {
    super(message, 'WORKFLOW_VIOLATION');
    this.name = 'WorkflowViolationException';
  }
}

export class PhaseValidationException extends WorkFloError {
  constructor(message: string, public currentPhase: TddPhase, public attemptedPhase: string) {
    super(message, 'PHASE_VALIDATION');
    this.name = 'PhaseValidationException';
  }
}

export class TestExecutionException extends WorkFloError {
  constructor(message: string, public exitCode?: number) {
    super(message, 'TEST_EXECUTION');
    this.name = 'TestExecutionException';
  }
}

export class GitHubApiException extends WorkFloError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'GITHUB_API');
    this.name = 'GitHubApiException';
  }
}

// Constants
export const TDD_PHASES: TddPhase[] = ['START', 'RED', 'GREEN', 'REFACTOR', 'COVER'];

export const PHASE_TRANSITIONS: Record<TddPhase, string[]> = {
  'START': ['red'],
  'RED': ['green'],
  'GREEN': ['refactor', 'cover'],
  'REFACTOR': ['cover'],
  'COVER': ['next']
};

export const CLAUDE_MD_KEY_POINTS = `🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.

Required sequence (no skipping allowed):
1. RED → Write ONE failing test for current acceptance criteria
2. GREEN → Minimal implementation to make test pass
3. REFACTOR → Improve code quality (optional)
4. COVER → Add comprehensive tests + mutation testing (85% threshold)
5. NEXT → Hard stop, must explicitly continue to next criteria

Key constraints:
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue`;

export const CLAUDE_MD_FULL_CONSTRAINTS = `🚫 CLAUDE.md TDD CONSTRAINTS REMINDER 🚫

📋 ULTRA-MINIMAL SELF-CONTAINED TDD WORKFLOW:
- Work on exactly ONE acceptance criteria at a time
- Hard stops between criteria prevent scope creep  
- No skipping phases allowed

🔄 REQUIRED SEQUENCE (RED-GREEN-REFACTOR-COVER-NEXT):
1. RED → Write ONE failing test for current acceptance criteria
2. GREEN → Minimal implementation to make test pass
3. REFACTOR → Improve code quality (optional)
4. COVER → Add comprehensive tests + mutation testing (85% threshold)
5. NEXT → Hard stop, must explicitly continue to next criteria

🛑 KEY CONSTRAINTS:
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue
- Tests must pass before advancing phases
- Mutation testing required in COVER phase (85% threshold)
- No manual git/gh commands - everything is automated
- Self-contained workflow with progressive disclosure

Remember: TUNNEL VISION on current criteria only!`;