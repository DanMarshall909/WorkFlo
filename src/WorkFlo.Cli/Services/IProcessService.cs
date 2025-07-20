namespace WorkFlo.Cli.Services;

internal interface IProcessService
{
    Task<ProcessResult> RunAsync(string command, string arguments = "", CancellationToken cancellationToken = default);
}

internal class ProcessResult
{
    public int ExitCode { get; init; }
    public string Output { get; init; } = string.Empty;
    public string Error { get; init; } = string.Empty;
}
