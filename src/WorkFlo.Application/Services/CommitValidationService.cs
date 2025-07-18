using WorkFlo.Domain.Common;
using WorkFlo.Domain.Rules;

namespace WorkFlo.Application.Services;

public class CommitValidationService : ICommitValidationService
{
    private readonly ICommitRule[] _preCommitRules;
    private readonly ICommitRule[] _commitMessageRules;
    
    public CommitValidationService()
    {
        _preCommitRules = new ICommitRule[]
        {
            new FileCountRule(),
            new BranchRule()
        };
        
        _commitMessageRules = new ICommitRule[]
        {
            new ConventionalCommitRule()
        };
    }
    
    public async Task<Result> ValidatePreCommitAsync(string[] stagedFiles, string currentBranch)
    {
        var context = new CommitContext
        {
            StagedFiles = stagedFiles.ToList(),
            CurrentBranch = currentBranch
        };
        
        foreach (var rule in _preCommitRules)
        {
            var result = rule.Validate(context);
            if (result.IsFailure())
            {
                return result;
            }
        }
        
        return await Task.FromResult(Result.Success()).ConfigureAwait(false);
    }
    
    public async Task<Result> ValidateCommitMessageAsync(string commitMessage)
    {
        var context = new CommitContext
        {
            CommitMessage = commitMessage
        };
        
        foreach (var rule in _commitMessageRules)
        {
            var result = rule.Validate(context);
            if (result.IsFailure())
            {
                return result;
            }
        }
        
        return await Task.FromResult(Result.Success()).ConfigureAwait(false);
    }
