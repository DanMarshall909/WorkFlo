namespace WorkFlo.Api.Mcp.Tools;

public class CommitValidationTool
{
    public CommitValidationResult ValidateCommitMessage(string commitMessage)
    {
        if (string.IsNullOrWhiteSpace(commitMessage))
        {
            return new CommitValidationResult
            {
                IsValid = false,
                ValidationMessage = "Commit message cannot be empty"
            };
        }

        // Check for conventional commit format: type: description
        var parts = commitMessage.Split(':', 2);
        if (parts.Length != 2)
        {
            return new CommitValidationResult
            {
                IsValid = false,
                ValidationMessage = "Commit message must follow conventional commit format: type: description"
            };
        }

        var type = parts[0].Trim();
        var description = parts[1].Trim();

        // Validate conventional commit types
        var validTypes = new[] { "feat", "fix", "docs", "style", "refactor", "test", "chore" };
        if (!validTypes.Contains(type))
        {
            return new CommitValidationResult
            {
                IsValid = false,
                Type = type,
                Description = description,
                ValidationMessage = $"Invalid commit type '{type}'. Valid types: {string.Join(", ", validTypes)}"
            };
        }

        return new CommitValidationResult
        {
            IsValid = true,
            Type = type,
            Description = description,
            ValidationMessage = "✅ Valid conventional commit format"
        };
    }
}

public class CommitValidationResult
{
    public bool IsValid { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ValidationMessage { get; set; } = string.Empty;
}