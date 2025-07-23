namespace WorkFlo.Cli.Services;

internal sealed class ConsoleService : IConsoleService
{
    public void WriteLine(string message)
    {
        Console.WriteLine(message);
    }

    public void WriteError(string message)
    {
        Console.Error.WriteLine(message);
    }

    public Task WriteLineAsync(string message)
    {
        return Console.Out.WriteLineAsync(message);
    }

    public Task WriteErrorAsync(string message)
    {
        return Console.Error.WriteLineAsync(message);
    }
}
