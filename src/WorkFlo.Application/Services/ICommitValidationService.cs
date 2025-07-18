using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Services;

public interface ICommitValidationService
{
    Task<Result> ValidatePreCommitAsync(string[] stagedFiles, string currentBranch);
    Task<Result> ValidateCommitMessageAsync(string commitMessage);
}