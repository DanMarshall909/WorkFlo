using MediatR;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Common.CQRS;

public abstract class BaseQueryHandler<TQuery, TResponse> : IRequestHandler<TQuery, TResponse>
    where TQuery : IRequest<TResponse>
{
    public abstract Task<TResponse> Handle(TQuery request, CancellationToken cancellationToken);
    
    protected TypeSafeResult<T, TError> Success<T, TError>(T value) =>
        TypeSafeResult<T, TError>.Success(value);
        
    protected TypeSafeResult<T, TError> Failure<T, TError>(TError error) =>
        TypeSafeResult<T, TError>.Failure(error);
}
