namespace WorkFlo.Api.Mcp.Tools;

public class CommitValidationTool
{
    private static readonly string[] ValidCommitTypes = 
    {
        "feat", "fix", "docs", "style", "refactor", "test", "chore"
    };

    private const string ConventionalFormatMessage = "Commit message must follow conventional commit format: type: description";
    private const string EmptyMessageError = "Commit message cannot be empty";
    private const string ValidFormatMessage = "✅ Valid conventional commit format";

    public CommitValidationResult ValidateCommitMessage(string commitMessage)
    {
        if (string.IsNullOrWhiteSpace(commitMessage))
        {
            return CreateInvalidResult(EmptyMessageError);
        }

        var (isValidFormat, type, description) = ParseCommitMessage(commitMessage);
        if (!isValidFormat)
        {
            return CreateInvalidResult(ConventionalFormatMessage);
        }

        if (!IsValidCommitType(type))
        {
            return CreateInvalidResult(
                $"Invalid commit type '{type}'. Valid types: {string.Join(", ", ValidCommitTypes)}",
                type,
                description);
        }

        return CreateValidResult(type, description);
    }

    private static (bool isValid, string type, string description) ParseCommitMessage(string commitMessage)
    {
        var parts = commitMessage.Split(':', 2);
        if (parts.Length != 2)
        {
            return (false, string.Empty, string.Empty);
        }

        var type = parts[0].Trim();
        var description = parts[1].Trim();
        return (true, type, description);
    }

    private static bool IsValidCommitType(string type)
    {
        return ValidCommitTypes.Contains(type);
    }

    private static CommitValidationResult CreateValidResult(string type, string description)
    {
        return new CommitValidationResult
        {
            IsValid = true,
            Type = type,
            Description = description,
            ValidationMessage = ValidFormatMessage
        };
    }

    private static CommitValidationResult CreateInvalidResult(string message, string type = "", string description = "")
    {
        return new CommitValidationResult
        {
            IsValid = false,
            Type = type,
            Description = description,
            ValidationMessage = message
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