using System.Text.RegularExpressions;
using WorkFlo.Domain.Common;

namespace WorkFlo.Domain.Rules;

public partial class ConventionalCommitRule : ICommitRule
{
    private static readonly Regex ConventionalCommitPattern = GenerateConventionalCommitRegex();
    
    public string Name => "Conventional Commit";
    public string Description => "Ensures commit messages follow conventional commit format";

    public Result Validate(CommitContext context)
    {
        if (string.IsNullOrWhiteSpace(context.CommitMessage))
        {
            return Result.Failure("Commit message must follow conventional commit format: <type>: <description>");
        }

        if (!ConventionalCommitPattern.IsMatch(context.CommitMessage))
        {
            return Result.Failure("Commit message must follow conventional commit format: <type>: <description>");
        }
        
        return Result.Success();
    }
    
    [GeneratedRegex(@"^(feat|fix|docs|style|refactor|test|chore):\s.+")]
    private static partial Regex GenerateConventionalCommitRegex();
}