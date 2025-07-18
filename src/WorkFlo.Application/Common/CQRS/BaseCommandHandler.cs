using MediatR;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Common.CQRS;

public abstract class BaseCommandHandler<TCommand, TResponse> : IRequestHandler<TCommand, TResponse>
    where TCommand : IRequest<TResponse>
{
    public abstract Task<TResponse> Handle(TCommand request, CancellationToken cancellationToken);
    
    protected TypeSafeResult<T, TError> Success<T, TError>(T value) =>
        TypeSafeResult<T, TError>.Success(value);
        
    protected TypeSafeResult<T, TError> Failure<T, TError>(TError error) =>
        TypeSafeResult<T, TError>.Failure(error);
}

public abstract class BaseCommandHandler<TCommand> : IRequestHandler<TCommand>
    where TCommand : IRequest
{
    public abstract Task Handle(TCommand request, CancellationToken cancellationToken);
}
