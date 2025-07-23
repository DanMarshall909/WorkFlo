namespace WorkFlo.Cli.Services;

internal interface IGitService
{
    Task<string[]> GetStagedFilesAsync();
    Task<string> GetCurrentBranchAsync();
}
