namespace WorkFlo.Cli.Services;

internal interface IConsoleService
{
    void WriteLine(string message);
    void WriteError(string message);
    Task WriteLineAsync(string message);
    Task WriteErrorAsync(string message);
}
