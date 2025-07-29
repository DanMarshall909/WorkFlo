using Xunit;

namespace WorkFlo.Core.Tests;

public class ClaudeMdValidationTests
{
    [Fact]
    public void StartupCheck_WhenClaudeMdNotRead_ThrowsValidationException()
    {
        // Given: A startup validator that checks if CLAUDE.md has been read
        var validator = new StartupValidator();
        
        // When: Validating startup without CLAUDE.md being read
        // Then: Should throw validation exception indicating CLAUDE.md must be read
        var exception = Assert.Throws<ClaudeMdNotReadException>(
            () => validator.ValidateClaudeMdRead()
        );
        
        Assert.Contains("CLAUDE.md", exception.Message);
        Assert.Contains("must be read", exception.Message);
    }

    [Fact]
    public void StartupCheck_WhenClaudeMdRead_DoesNotThrowException()
    {
        // Given: A startup validator and CLAUDE.md has been read
        var validator = new StartupValidator();
        validator.MarkClaudeMdAsRead();
        
        // When: Validating startup after CLAUDE.md has been read
        // Then: Should not throw any exception
        var exception = Record.Exception(() => validator.ValidateClaudeMdRead());
        Assert.Null(exception);
    }

    [Fact]
    public void WorkflowDeviation_WhenAiDeviatesFromTddWorkflow_DisplaysClaudeMdKeyPoints()
    {
        // Given: A workflow monitor that detects TDD violations
        var monitor = new WorkflowMonitor();
        var validator = new StartupValidator();
        validator.MarkClaudeMdAsRead();
        
        // When: AI deviates from TDD workflow (e.g., skips red phase)
        var violation = new WorkflowViolation("Attempted to implement code without failing test first");
        
        // Then: Should display CLAUDE.md key points about TDD discipline
        var keyPoints = monitor.GetClaudeMdKeyPointsForViolation(violation);
        
        Assert.NotNull(keyPoints);
        Assert.Contains("RED", keyPoints);
        Assert.Contains("failing test", keyPoints);
        Assert.Contains("ONE acceptance criteria", keyPoints);
    }

    [Fact]
    public void WorkflowViolationDetection_WhenMultipleActionsAttempted_DetectsAndCorrects()
    {
        // Given: A workflow detector that monitors for TDD violations
        var detector = new WorkflowViolationDetector();
        var actions = new List<string> { "implement feature", "write test", "refactor code" };
        
        // When: AI attempts to do multiple actions instead of ONE
        var result = detector.DetectAndCorrect(actions);
        
        // Then: Should detect violation and auto-correct to single action
        Assert.True(result.ViolationDetected);
        Assert.Equal("Multiple actions attempted. TDD requires ONE action at a time.", result.ViolationMessage);
        Assert.Single(result.CorrectedActions);
        Assert.Equal("write test", result.CorrectedActions[0]); // Should prioritize test-first
    }

    [Fact]
    public void ReminderCommand_WhenExecuted_DisplaysClaudeMdConstraints()
    {
        // Given: A command service that can remind AI of constraints
        var commandService = new ClaudeMdReminderService();
        
        // When: Executing the remind command
        var result = commandService.ExecuteRemindCommand();
        
        // Then: Should display all key CLAUDE.md constraints
        Assert.NotNull(result);
        Assert.Contains("ONE acceptance criteria at a time", result);
        Assert.Contains("RED-GREEN-REFACTOR-COVER-NEXT", result);
        Assert.Contains("Hard stops between criteria", result);
        Assert.Contains("No skipping phases", result);
    }

    [Fact]
    public void TddCoverPhase_WhenExecuted_ShouldNotRunMutationTesting()
    {
        // Given: A TDD workflow manager that handles phase execution
        var tddWorkflow = new TddWorkflowManager();
        
        // When: Executing the COVER phase
        var result = tddWorkflow.ExecuteCoverPhase();
        
        // Then: Should not run mutation testing during COVER phase
        Assert.False(result.MutationTestingExecuted);
        Assert.Contains("Mutation testing will be performed during PR submission", result.Message);
    }

    [Fact]
    public void ConfidenceScoring_WhenCalculatingForPR_UsesPostPRMutationResults()
    {
        // Given: A confidence calculator that processes PR-time results
        var confidenceCalculator = new PrConfidenceCalculator();
        var prResults = new PrValidationResults
        {
            TestsPassed = true,
            CodeCoverage = 95,
            ReviewScore = 88,
            MutationScore = 85 // This will be calculated after PR creation
        };
        
        // When: Calculating confidence score for PR
        var result = confidenceCalculator.CalculateConfidence(prResults);
        
        // Then: Should use mutation score from PR validation, not TDD COVER phase
        Assert.True(result.UsedPrMutationTesting);
        Assert.Equal(85, result.MutationScore);
        Assert.True(result.TotalScore >= 90); // Should meet confidence threshold
    }

    [Fact]
    public void ClaudeMdDocumentation_WhenMutationTestingMoved_DocumentsChangeCorrectly()
    {
        // Given: Documentation about mutation testing changes
        var documentationService = new DocumentationService();
        
        // When: Checking if mutation testing move is documented
        var isDocumented = documentationService.IsMutationTestingMoveDocumented();
        
        // Then: Should confirm the change is documented in CLAUDE.md
        Assert.True(isDocumented);
    }
}

// Minimal implementation for mutation testing move (GREEN phase)
public class TddWorkflowManager
{
    public CoverPhaseResult ExecuteCoverPhase()
    {
        return new CoverPhaseResult
        {
            MutationTestingExecuted = false,
            Message = "Mutation testing will be performed during PR submission"
        };
    }
}

public class CoverPhaseResult
{
    public bool MutationTestingExecuted { get; set; }
    public string Message { get; set; } = string.Empty;
}

// Minimal implementation for confidence scoring (GREEN phase)
public class PrConfidenceCalculator
{
    public ConfidenceResult CalculateConfidence(PrValidationResults prResults)
    {
        // Calculate confidence using PR-time mutation testing results
        var totalScore = (prResults.TestsPassed ? 30 : 0) + 
                        (prResults.CodeCoverage * 25 / 100) + 
                        (prResults.ReviewScore * 25 / 100) + 
                        (prResults.MutationScore * 20 / 100);

        return new ConfidenceResult
        {
            UsedPrMutationTesting = true,
            MutationScore = prResults.MutationScore,
            TotalScore = totalScore
        };
    }
}

public class PrValidationResults
{
    public bool TestsPassed { get; set; }
    public int CodeCoverage { get; set; }
    public int ReviewScore { get; set; }
    public int MutationScore { get; set; }
}

public class ConfidenceResult
{
    public bool UsedPrMutationTesting { get; set; }
    public int MutationScore { get; set; }
    public int TotalScore { get; set; }
}

// Minimal implementation for documentation verification (GREEN phase)
public class DocumentationService
{
    public bool IsMutationTestingMoveDocumented()
    {
        // Check if CLAUDE.md contains documentation about mutation testing move
        var claudeMdPath = "/home/dan/code/WorkFlo/CLAUDE.md";
        if (File.Exists(claudeMdPath))
        {
            var content = File.ReadAllText(claudeMdPath);
            return content.Contains("mutation testing has been moved from") && 
                   content.Contains("PR submission time");
        }
        return false;
    }
}

// Minimal implementation to pass test (GREEN phase)
public class StartupValidator
{
    private bool _claudeMdRead = false;

    public void ValidateClaudeMdRead()
    {
        if (!_claudeMdRead)
        {
            throw new ClaudeMdNotReadException("CLAUDE.md must be read before starting TDD workflow");
        }
    }

    public void MarkClaudeMdAsRead()
    {
        _claudeMdRead = true;
    }
}

public class ClaudeMdNotReadException : Exception
{
    public ClaudeMdNotReadException(string message) : base(message) { }
}

// Classes for second acceptance criteria (RED phase - should fail)
public class WorkflowMonitor
{
    public string GetClaudeMdKeyPointsForViolation(WorkflowViolation violation)
    {
        // Minimal implementation - return CLAUDE.md key points for TDD workflow
        return @"🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.

Required sequence (no skipping allowed):
1. RED → Write ONE failing test for current acceptance criteria
2. GREEN → Minimal implementation to make test pass
3. REFACTOR → Improve code quality (optional)
4. COVER → Add comprehensive tests + mutation testing (85% threshold)
5. NEXT → Hard stop, must explicitly continue to next criteria

Key constraints:
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue";
    }
}

public class WorkflowViolation
{
    public string Description { get; }
    
    public WorkflowViolation(string description)
    {
        Description = description;
    }
}

// Classes for third acceptance criteria (RED phase - should fail)
public class WorkflowViolationDetector
{
    public WorkflowDetectionResult DetectAndCorrect(List<string> actions)
    {
        // Minimal implementation - detect multiple actions and prioritize tests
        var result = new WorkflowDetectionResult();
        
        if (actions.Count > 1)
        {
            result.ViolationDetected = true;
            result.ViolationMessage = "Multiple actions attempted. TDD requires ONE action at a time.";
            
            // Auto-correct: prioritize test-first approach
            var testAction = actions.FirstOrDefault(a => a.Contains("test"));
            if (testAction != null)
            {
                result.CorrectedActions.Add(testAction);
            }
            else
            {
                result.CorrectedActions.Add(actions.First());
            }
        }
        else
        {
            result.ViolationDetected = false;
            result.CorrectedActions.AddRange(actions);
        }
        
        return result;
    }
}

public class WorkflowDetectionResult
{
    public bool ViolationDetected { get; set; }
    public string ViolationMessage { get; set; } = string.Empty;
    public List<string> CorrectedActions { get; set; } = new();
}

// Classes for fourth acceptance criteria (RED phase - should fail)
public class ClaudeMdReminderService
{
    public string ExecuteRemindCommand()
    {
        // Minimal implementation - return comprehensive CLAUDE.md constraints
        return @"🚫 CLAUDE.md TDD CONSTRAINTS REMINDER 🚫

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

Remember: TUNNEL VISION on current criteria only!";
    }
}