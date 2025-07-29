import { 
  WorkflowViolation, 
  WorkflowDetectionResult, 
  CLAUDE_MD_KEY_POINTS, 
  CLAUDE_MD_FULL_CONSTRAINTS,
  WorkflowViolationException 
} from './interfaces';

export class WorkflowMonitor {
  
  /**
   * Gets CLAUDE.md key points for a specific workflow violation
   * Ported from .NET WorkflowMonitor class
   */
  getClaudeMdKeyPointsForViolation(violation: WorkflowViolation): string {
    // Return the key TDD workflow constraints from CLAUDE.md
    return CLAUDE_MD_KEY_POINTS;
  }

  /**
   * Detects when AI attempts multiple actions instead of focusing on one
   * Ported from .NET WorkflowViolationDetector class
   */
  detectAndCorrect(actions: string[]): WorkflowDetectionResult {
    const result: WorkflowDetectionResult = {
      violationDetected: false,
      violationMessage: '',
      correctedActions: [],
      suggestions: []
    };

    if (actions.length > 1) {
      result.violationDetected = true;
      result.violationMessage = 'Multiple actions attempted. TDD requires ONE action at a time.';
      
      // Auto-correct: prioritize test-first approach
      const testAction = actions.find(action => 
        action.toLowerCase().includes('test') || 
        action.toLowerCase().includes('spec') ||
        action.toLowerCase().includes('failing')
      );
      
      if (testAction) {
        result.correctedActions.push(testAction);
        result.suggestions = [
          'Focus on writing ONE failing test first',
          'Complete the current TDD phase before moving to the next',
          'Remember: RED → GREEN → REFACTOR → COVER → NEXT'
        ];
      } else {
        // If no test action found, take the first action but warn
        result.correctedActions.push(actions[0]);
        result.suggestions = [
          'Consider starting with a failing test (RED phase)',
          'TDD workflow requires test-first development',
          'Review CLAUDE.md for TDD phase requirements'
        ];
      }
    } else {
      result.violationDetected = false;
      result.correctedActions = [...actions];
    }

    return result;
  }

  /**
   * Monitors for scope creep - working on multiple acceptance criteria
   */
  detectScopeCreep(currentCriteria: number, mentionedCriteria: number[]): WorkflowViolation | null {
    const otherCriteria = mentionedCriteria.filter(c => c !== currentCriteria);
    
    if (otherCriteria.length > 0) {
      return {
        description: `Attempted to work on criteria ${otherCriteria.join(', ')} while current focus should be criteria ${currentCriteria}`,
        phase: undefined,
        severity: 'high',
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Detects attempts to skip TDD phases
   */
  detectPhaseSkipping(currentPhase: string, attemptedPhase: string): WorkflowViolation | null {
    const validTransitions: Record<string, string[]> = {
      'START': ['red'],
      'RED': ['green'],
      'GREEN': ['refactor', 'cover'],
      'REFACTOR': ['cover'],
      'COVER': ['next']
    };

    const allowedNext = validTransitions[currentPhase.toUpperCase()] || [];
    
    if (!allowedNext.includes(attemptedPhase.toLowerCase())) {
      return {
        description: `Attempted to skip from ${currentPhase} phase to ${attemptedPhase}. Required sequence: RED → GREEN → REFACTOR → COVER → NEXT`,
        phase: currentPhase as any,
        severity: 'high',
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Detects premature mutation testing (should only run at PR time)
   */
  detectPrematureMutationTesting(phase: string, mutationTestingAttempted: boolean): WorkflowViolation | null {
    if (mutationTestingAttempted && phase !== 'PR_SUBMISSION') {
      return {
        description: 'Mutation testing attempted during TDD cycle. Mutation testing should only run during PR submission.',
        phase: phase as any,
        severity: 'medium',
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Generates corrective guidance based on violation type
   */
  generateCorrectionGuidance(violation: WorkflowViolation): string {
    switch (violation.severity) {
      case 'high':
        return `🚫 CRITICAL VIOLATION: ${violation.description}\n\n${CLAUDE_MD_KEY_POINTS}`;
      
      case 'medium':
        return `⚠️ WORKFLOW WARNING: ${violation.description}\n\nPlease review the TDD phase requirements and continue with the correct sequence.`;
      
      case 'low':
        return `ℹ️ MINOR DEVIATION: ${violation.description}\n\nConsider adjusting your approach to better align with TDD principles.`;
      
      default:
        return `VIOLATION: ${violation.description}`;
    }
  }

  /**
   * Validates that current action aligns with TDD phase requirements
   */
  validateActionForPhase(phase: string, action: string): WorkflowViolation | null {
    const phaseRequirements: Record<string, string[]> = {
      'RED': ['test', 'failing', 'spec', 'expect'],
      'GREEN': ['implement', 'minimal', 'simple', 'basic'],
      'REFACTOR': ['refactor', 'improve', 'clean', 'optimize'],
      'COVER': ['coverage', 'comprehensive', 'edge', 'boundary']
    };

    const requiredKeywords = phaseRequirements[phase.toUpperCase()] || [];
    const actionLower = action.toLowerCase();
    
    const hasRequiredKeyword = requiredKeywords.some(keyword => 
      actionLower.includes(keyword)
    );

    if (requiredKeywords.length > 0 && !hasRequiredKeyword) {
      return {
        description: `Action "${action}" doesn't align with ${phase} phase requirements. Expected keywords: ${requiredKeywords.join(', ')}`,
        phase: phase as any,
        severity: 'medium',
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Creates a comprehensive workflow violation report
   */
  createViolationReport(violations: WorkflowViolation[]): string {
    if (violations.length === 0) {
      return '✅ No workflow violations detected. TDD workflow is on track.';
    }

    const report = [
      '🚨 WORKFLOW VIOLATION REPORT',
      '==============================',
      ''
    ];

    violations.forEach((violation, index) => {
      report.push(`${index + 1}. ${violation.severity.toUpperCase()}: ${violation.description}`);
      report.push(`   Timestamp: ${violation.timestamp.toISOString()}`);
      if (violation.phase) {
        report.push(`   Phase: ${violation.phase}`);
      }
      report.push('');
    });

    report.push('🔧 CORRECTIVE ACTION REQUIRED:');
    report.push(CLAUDE_MD_KEY_POINTS);

    return report.join('\n');
  }
}

/**
 * Service for providing CLAUDE.md reminders
 * Ported from .NET ClaudeMdReminderService class
 */
export class ClaudeMdReminderService {
  
  /**
   * Executes the remind command to display CLAUDE.md constraints
   */
  executeRemindCommand(): string {
    return CLAUDE_MD_FULL_CONSTRAINTS;
  }

  /**
   * Gets a brief reminder of current phase requirements
   */
  getPhaseReminder(phase: string): string {
    const phaseReminders: Record<string, string> = {
      'RED': '🔴 RED Phase: Write ONE failing test for current acceptance criteria only',
      'GREEN': '🟢 GREEN Phase: Minimal implementation to make the test pass',
      'REFACTOR': '🔵 REFACTOR Phase: Improve code quality while keeping tests green',
      'COVER': '🟣 COVER Phase: Add comprehensive test coverage (mutation testing at PR time)',
      'START': '⚡ START Phase: Ready to begin with RED phase (write failing test)'
    };

    return phaseReminders[phase.toUpperCase()] || 'Unknown phase - please check TDD workflow';
  }

  /**
   * Gets tunnel vision reminder for current criteria
   */
  getTunnelVisionReminder(currentCriteria: number, totalCriteria: number): string {
    return `🎯 TUNNEL VISION: Focus ONLY on criteria ${currentCriteria}/${totalCriteria}
    
🚫 Do NOT work on other criteria
🚫 Do NOT implement extra features  
🚫 Do NOT skip TDD phases

✅ Write ONE test for current criteria only
✅ Follow RED → GREEN → REFACTOR → COVER → NEXT sequence`;
  }
}