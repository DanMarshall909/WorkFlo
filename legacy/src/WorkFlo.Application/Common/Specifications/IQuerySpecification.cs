using System.Linq.Expressions;

namespace WorkFlo.Application.Common.Specifications;

/// <summary>
/// Base interface for query specifications that define filtering criteria for aggregate queries.
/// Specifications are used to encapsulate query logic and make it reusable and testable.
/// </summary>
/// <typeparam name="T">The aggregate type being queried</typeparam>
public interface IQuerySpecification<T>
{
    /// <summary>
    /// Converts the specification to a LINQ expression that can be used with Entity Framework
    /// or other LINQ providers for database queries.
    /// </summary>
    /// <returns>An expression tree representing the specification criteria</returns>
    Expression<Func<T, bool>> ToExpression();

    /// <summary>
    /// Evaluates whether the given entity satisfies this specification.
    /// Useful for in-memory filtering and testing.
    /// </summary>
    /// <param name="entity">The entity to evaluate</param>
    /// <returns>True if the entity satisfies the specification, false otherwise</returns>
    bool IsSatisfiedBy(T entity);
}
