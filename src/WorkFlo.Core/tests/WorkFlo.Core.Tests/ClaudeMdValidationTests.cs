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
}

// Minimal implementation to pass test (GREEN phase)
public class StartupValidator
{
    public void ValidateClaudeMdRead()
    {
        // Minimal implementation - always throw for now
        throw new ClaudeMdNotReadException("CLAUDE.md must be read before starting TDD workflow");
    }

    public void MarkClaudeMdAsRead()
    {
        // Not implemented yet - test should fail
        throw new NotImplementedException("MarkClaudeMdAsRead not implemented");
    }
}

public class ClaudeMdNotReadException : Exception
{
    public ClaudeMdNotReadException(string message) : base(message) { }
}