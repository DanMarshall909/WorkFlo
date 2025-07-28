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
        throw new NotImplementedException("DetectAndCorrect not implemented");
    }
}

public class WorkflowDetectionResult
{
    public bool ViolationDetected { get; set; }
    public string ViolationMessage { get; set; } = string.Empty;
    public List<string> CorrectedActions { get; set; } = new();
}