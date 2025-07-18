using MediatR;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Common.Errors;

namespace WorkFlo.Application.Common.CQRS;

public abstract class BaseCommandHandler<TCommand, TResponse> : IRequestHandler<TCommand, TResponse>
    where TCommand : IRequest<TResponse>
{
    public abstract Task<TResponse> Handle(TCommand request, CancellationToken cancellationToken);
    
    protected TypeSafeResult<T, TError> Success<T, TError>(T value) 
        where TError : IError =>
        TypeSafeResult<T, TError>.Success(value);
        
    protected TypeSafeResult<T, TError> Failure<T, TError>(TError error) 
        where TError : IError =>
        TypeSafeResult<T, TError>.Failure(error);
}

public abstract class BaseCommandHandler<TCommand> : IRequestHandler<TCommand>
    where TCommand : IRequest
{
    public abstract Task Handle(TCommand request, CancellationToken cancellationToken);
}
