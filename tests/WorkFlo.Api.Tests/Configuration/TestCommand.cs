namespace WorkFlo.Api.Tests.Configuration;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "MA0048:File name must match type name",
    Justification = "Test helper classes")]
internal class TestCommand : Application.Common.CQRS.ICommand<TestCommandResponse>
{
    public string Data { get; init; } = string.Empty;
}
