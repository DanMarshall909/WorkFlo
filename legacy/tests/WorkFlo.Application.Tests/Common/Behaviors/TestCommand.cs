using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Tests.Common.Behaviors;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "MA0048:File name must match type name",
    Justification = "Test helper class in test file")]
public class TestCommand : ICommand<Result<string>>
{
    public string TestData { get; init; } = string.Empty;
}
