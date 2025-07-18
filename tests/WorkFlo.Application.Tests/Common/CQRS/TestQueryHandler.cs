using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Tests.Common.CQRS;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "MA0048:File name must match type name",
    Justification = "Test helper classes in test file")]
internal class TestQueryHandler : IQueryHandler<TestQuery, Result<string>>
{
    public Task<Result<string>> Handle(TestQuery request, CancellationToken cancellationToken)
    {
        var result = ResultExtensions.Success($"Queried: {request.QueryData}");
        return Task.FromResult(result);
    }
}
