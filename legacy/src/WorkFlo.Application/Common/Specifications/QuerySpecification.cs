using System.Linq.Expressions;

namespace WorkFlo.Application.Common.Specifications;

/// <summary>
/// Abstract base class for query specifications providing common functionality
/// and operator overloading for composing specifications.
/// </summary>
/// <typeparam name="T">The aggregate type being queried</typeparam>
public abstract class QuerySpecification<T> : IQuerySpecification<T>
{
    /// <summary>
    /// Converts the specification to a LINQ expression.
    /// Must be implemented by concrete specifications.
    /// </summary>
    public abstract Expression<Func<T, bool>> ToExpression();

    /// <summary>
    /// Evaluates whether the given entity satisfies this specification
    /// by compiling the expression and executing it.
    /// </summary>
    /// <param name="entity">The entity to evaluate</param>
    /// <returns>True if the entity satisfies the specification</returns>
    public bool IsSatisfiedBy(T entity)
    {
        return ToExpression().Compile()(entity);
    }

    /// <summary>
    /// Combines this specification with another using logical AND.
    /// </summary>
    /// <param name="other">The specification to combine with</param>
    /// <returns>A new specification representing the AND combination</returns>
    public QuerySpecification<T> And(QuerySpecification<T> other)
    {
        return new AndQuerySpecification<T>(this, other);
    }

    /// <summary>
    /// Combines this specification with another using logical OR.
    /// </summary>
    /// <param name="other">The specification to combine with</param>
    /// <returns>A new specification representing the OR combination</returns>
    public QuerySpecification<T> Or(QuerySpecification<T> other)
    {
        return new OrQuerySpecification<T>(this, other);
    }

    /// <summary>
    /// Creates a negation of this specification.
    /// </summary>
    /// <returns>A new specification representing the NOT of this specification</returns>
    public QuerySpecification<T> Not()
    {
        return new NotQuerySpecification<T>(this);
    }

    /// <summary>
    /// Operator overload for AND combination using &amp; syntax.
    /// </summary>
    public static QuerySpecification<T> operator &(QuerySpecification<T> left, QuerySpecification<T> right)
    {
        return new AndQuerySpecification<T>(left, right);
    }

    /// <summary>
    /// Operator overload for OR combination using | syntax.
    /// </summary>
    public static QuerySpecification<T> operator |(QuerySpecification<T> left, QuerySpecification<T> right)
    {
        return new OrQuerySpecification<T>(left, right);
    }

    /// <summary>
    /// Operator overload for NOT using ! syntax.
    /// </summary>
    public static QuerySpecification<T> operator !(QuerySpecification<T> specification)
    {
        return new NotQuerySpecification<T>(specification);
    }

    public static QuerySpecification<T> BitwiseAnd(QuerySpecification<T> left, QuerySpecification<T> right)
    {
        throw new NotImplementedException();
    }

    public static QuerySpecification<T> BitwiseOr(QuerySpecification<T> left, QuerySpecification<T> right)
    {
        throw new NotImplementedException();
    }

    public static QuerySpecification<T> LogicalNot(QuerySpecification<T> left, QuerySpecification<T> right)
    {
        throw new NotImplementedException();
    }
}
