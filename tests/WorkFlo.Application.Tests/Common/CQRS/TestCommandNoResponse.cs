using WorkFlo.Application.Common.CQRS;

namespace WorkFlo.Application.Tests.Common.CQRS;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "MA0048:File name must match type name",
    Justification = "Test helper classes in test file")]
internal class TestCommandNoResponse : ICommand
{
    public string TestData { get; init; } = string.Empty;
}
