using WorkFlo.Domain.Common;

namespace WorkFlo.Domain.Rules;

public interface ICommitRule
{
    string Name { get; }
    string Description { get; }
    Result Validate(CommitContext context);
}

public class CommitContext
{
    public IReadOnlyList<string> StagedFiles { get; init; } = new List<string>();
    public string CurrentBranch { get; init; } = string.Empty;
    public string CommitMessage { get; init; } = string.Empty;
    public string RepositoryPath { get; init; } = string.Empty;
}