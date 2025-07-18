namespace WorkFlo.Cli.Services;

public class ConsoleService : IConsoleService
{
    public void WriteLine(string message)
    {
        Console.WriteLine(message);
    }

    public void WriteError(string message)
    {
        Console.Error.WriteLine(message);
    }

    public async Task WriteLineAsync(string message)
    {
        await Console.Out.WriteLineAsync(message).ConfigureAwait(false);
    }

    public async Task WriteErrorAsync(string message)
    {
        await Console.Error.WriteLineAsync(message).ConfigureAwait(false);
    }
