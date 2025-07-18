using WorkFlo.Domain.Common;

namespace WorkFlo.Domain.Rules;

public class FileCountRule : ICommitRule
{
    private const int MaxFilesPerCommit = 3;
    
    public string Name => "File Count";
    public string Description => "Limits the number of files per commit";

    public Result Validate(CommitContext context)
    {
        if (context.StagedFiles.Count > MaxFilesPerCommit)
        {
            return Result.Failure($"Too many files in commit. Maximum {MaxFilesPerCommit} files allowed, but found {context.StagedFiles.Count}.");
        }
        
        return Result.Success();
    }
}