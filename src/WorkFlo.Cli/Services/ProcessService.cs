using System.Diagnostics;

namespace WorkFlo.Cli.Services;

internal sealed class ProcessService : IProcessService
{
    public async Task<ProcessResult> RunAsync(string command, string arguments = "", CancellationToken cancellationToken = default)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = command,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        process.Start();

        Task<string> outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        Task<string> errorTask = process.StandardError.ReadToEndAsync(cancellationToken);

        await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);

        return new ProcessResult
        {
            ExitCode = process.ExitCode,
            Output = await outputTask.ConfigureAwait(false),
            Error = await errorTask.ConfigureAwait(false)
        };
    }
}
