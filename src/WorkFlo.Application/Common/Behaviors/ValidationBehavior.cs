using WorkFlo.Application.Common.Validation;
using WorkFlo.Domain.Common;
using MediatR;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Common.Behaviors;

/// <summary>
/// Pipeline behavior that validates commands and queries before they are handled.
/// If validation fails, the request is not passed to the handler.
/// </summary>
/// <typeparam name="TRequest">The type of request being validated</typeparam>
/// <typeparam name="TResponse">The type of response from the handler</typeparam>
[System.Diagnostics.CodeAnalysis.SuppressMessage("Performance", "CA2016:Forward the 'cancellationToken' parameter",
    Justification = "RequestHandlerDelegate in MediatR pipeline does not accept cancellation token parameter")]
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IValidatorProvider _validatorProvider;

    public ValidationBehavior(IValidatorProvider validatorProvider)
    {
        _validatorProvider = validatorProvider ?? throw new ArgumentNullException(nameof(validatorProvider));
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(next);
        cancellationToken.ThrowIfCancellationRequested();

        var validators = _validatorProvider.GetValidators<TRequest>().ToList();

        if (!validators.Any())
        {
            return await next().ConfigureAwait(false);
        }

        IEnumerable<Task<IValidationResult>> validationTasks =
            validators.Select(v => v.ValidateAsync(request, cancellationToken));
        IValidationResult[] validationResults =
            await Task.WhenAll(validationTasks).ConfigureAwait(false);

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
        {
            string errorMessage = string.Join("; ", failures.Select(f => f.ErrorMessage));

            // Use reflection to create a failure result of the correct type
            // This handles both Result<T> and Result return types
            if (typeof(TResponse).IsGenericType &&
                typeof(TResponse).GetGenericTypeDefinition() == typeof(Result<>))
            {
                Type resultType = typeof(TResponse).GetGenericArguments()[0];

                [System.Diagnostics.CodeAnalysis.SuppressMessage("AOT",
                    "IL3050:Using member which has 'RequiresDynamicCodeAttribute' can break functionality when AOT compiling",
                    Justification = "Reflection is required for generic Result<T> handling in pipeline behavior")]
                static System.Reflection.MethodInfo? GetFailureMethod(Type type)
                {
                    return typeof(ResultExtensions)
                        .GetMethod(nameof(Failure))
                        ?.MakeGenericMethod(type);
                }

                System.Reflection.MethodInfo? failureMethod = GetFailureMethod(resultType);

                if (failureMethod != null)
                {
                    object? result = failureMethod.Invoke(null, [errorMessage]);
                    return (TResponse)result!;
                }
            }
            else if (typeof(TResponse) == typeof(Result))
            {
                var result = Result.Failure(errorMessage);
                return (TResponse)(object)result;
            }

            // Fallback for non-Result types - this should not happen in our CQRS architecture
            throw new InvalidOperationException($"Validation failed: {errorMessage}");
        }

        return await next().ConfigureAwait(false);
    }
}
