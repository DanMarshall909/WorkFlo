namespace WorkFlo.Cli.Services;

public interface IGitService
{
    Task<string[]> GetStagedFilesAsync();
    Task<string> GetCurrentBranchAsync();
}