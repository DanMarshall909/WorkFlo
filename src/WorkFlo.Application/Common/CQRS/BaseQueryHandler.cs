using MediatR;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Common.Errors;

namespace WorkFlo.Application.Common.CQRS;

public abstract class BaseQueryHandler<TQuery, TResponse> : IRequestHandler<TQuery, TResponse>
    where TQuery : IRequest<TResponse>
{
    public abstract Task<TResponse> Handle(TQuery request, CancellationToken cancellationToken);
    
    protected TypeSafeResult<T, TError> Success<T, TError>(T value) 
        where TError : IError =>
        TypeSafeResult<T, TError>.Success(value);
        
    protected TypeSafeResult<T, TError> Failure<T, TError>(TError error) 
        where TError : IError =>
        TypeSafeResult<T, TError>.Failure(error);
}
