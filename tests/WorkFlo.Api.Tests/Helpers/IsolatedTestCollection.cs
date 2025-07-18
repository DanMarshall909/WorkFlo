using WorkFlo.Api.Tests.Helpers;
using Xunit;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Collection fixture to ensure test classes don't share application instances
/// This prevents static state pollution between test classes
/// </summary>
[CollectionDefinition("IsolatedTests", DisableParallelization = true)]
public class IsolatedTestCollection : ICollectionFixture<TestWebApplicationFactory>
{
    // This class is intentionally empty. It's used to define the collection
    // and ensure that test classes in this collection are run sequentially
    // with fresh factory instances.
}
