namespace WorkFlo.Cli.Services;

public interface IProcessService
{
    Task<ProcessResult> RunAsync(string command, string arguments = "", CancellationToken cancellationToken = default);
}

public class ProcessResult
{
    public int ExitCode { get; init; }
    public string Output { get; init; } = string.Empty;
    public string Error { get; init; } = string.Empty;
}