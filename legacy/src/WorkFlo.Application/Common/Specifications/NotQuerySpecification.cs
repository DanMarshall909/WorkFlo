using System.Linq.Expressions;

namespace WorkFlo.Application.Common.Specifications;

/// <summary>
/// Specification that negates another specification using logical NOT.
/// </summary>
/// <typeparam name="T">The aggregate type being queried</typeparam>
internal sealed class NotQuerySpecification<T>(QuerySpecification<T> specification) : QuerySpecification<T>
{
    private readonly QuerySpecification<T> _specification =
        specification ?? throw new ArgumentNullException(nameof(specification));

    public override Expression<Func<T, bool>> ToExpression()
    {
        var expression = _specification.ToExpression();
        ParameterExpression parameter = expression.Parameters[0];

        return Expression.Lambda<Func<T, bool>>(
            Expression.Not(expression.Body),
            parameter);
    }
}
