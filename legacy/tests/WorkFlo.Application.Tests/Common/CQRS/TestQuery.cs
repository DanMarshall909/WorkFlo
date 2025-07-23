using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Tests.Common.CQRS;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "MA0048:File name must match type name",
    Justification = "Test helper classes in test file")]
internal class TestQuery : IQuery<Result<string>>
{
    public string QueryData { get; init; } = string.Empty;
}
