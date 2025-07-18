using System.Linq.Expressions;

namespace WorkFlo.Application.Common.Specifications;

/// <summary>
/// Specification that combines two specifications using logical AND.
/// </summary>
/// <typeparam name="T">The aggregate type being queried</typeparam>
internal sealed class AndQuerySpecification<T>(QuerySpecification<T> left, QuerySpecification<T> right)
    : QuerySpecification<T>
{
    private readonly QuerySpecification<T> _left = left ?? throw new ArgumentNullException(nameof(left));
    private readonly QuerySpecification<T> _right = right ?? throw new ArgumentNullException(nameof(right));

    public override Expression<Func<T, bool>> ToExpression()
    {
        var leftExpression = _left.ToExpression();
        var rightExpression = _right.ToExpression();

        ParameterExpression parameter = Expression.Parameter(typeof(T));

        var leftVisitor = new ReplaceExpressionVisitor(leftExpression.Parameters[0], parameter);
        var rightVisitor = new ReplaceExpressionVisitor(rightExpression.Parameters[0], parameter);

        Expression leftBody = leftVisitor.Visit(leftExpression.Body) ?? leftExpression.Body;
        Expression rightBody = rightVisitor.Visit(rightExpression.Body) ?? rightExpression.Body;

        return Expression.Lambda<Func<T, bool>>(
            Expression.AndAlso(leftBody, rightBody),
            parameter);
    }
}
