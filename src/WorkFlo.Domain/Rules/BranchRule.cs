using WorkFlo.Domain.Common;

namespace WorkFlo.Domain.Rules;

public class BranchRule : ICommitRule
{
    private const string RequiredBranch = "dev";
    
    public string Name => "Branch";
    public string Description => "Ensures commits are made on the correct branch";

    public Result Validate(CommitContext context)
    {
        if (context.CurrentBranch != RequiredBranch)
        {
            return Result.Failure($"Commits must be made on the '{RequiredBranch}' branch. Current branch is '{context.CurrentBranch}'.");
        }
        
        return Result.Success();
    }
}