using System.Linq.Expressions;

namespace WorkFlo.Application.Common.Specifications;

/// <summary>
/// Expression visitor that replaces one expression with another.
/// Used to unify parameter expressions when combining specifications.
/// </summary>
internal sealed class ReplaceExpressionVisitor(Expression oldValue, Expression newValue) : ExpressionVisitor
{
    private readonly Expression _oldValue = oldValue;
    private readonly Expression _newValue = newValue;

    public override Expression? Visit(Expression? node)
    {
        return node == _oldValue ? _newValue : base.Visit(node);
    }
}
