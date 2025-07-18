using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;
using FluentAssertions;
using MediatR;

namespace WorkFlo.Application.Tests.Common.CQRS;

public class CQRSInterfacesTests
{
    [Fact]
    public void ICommand_should_inherit_from_IRequest()
    {
        typeof(ICommand).Should().BeAssignableTo<IRequest>("ICommand should inherit from MediatR IRequest");
    }

    [Fact]
    public void ICommand_with_generic_return_should_inherit_from_IRequest()
    {
        // Act & Assert
        typeof(ICommand<string>).Should()
            .BeAssignableTo<IRequest<string>>("ICommand<T> should inherit from MediatR IRequest<T>");
    }

    [Fact]
    public void IQuery_should_inherit_from_IRequest()
    {
        // Act & Assert
        typeof(IQuery<string>).Should()
            .BeAssignableTo<IRequest<string>>("IQuery<T> should inherit from MediatR IRequest<T>");
    }

    [Fact]
    public void ICommandHandler_should_inherit_from_IRequestHandler()
    {
        // Act & Assert
        typeof(ICommandHandler<TestCommandNoResponse>).Should()
            .BeAssignableTo<IRequestHandler<TestCommandNoResponse>>(
                "ICommandHandler should inherit from MediatR IRequestHandler");
    }

    [Fact]
    public void ICommandHandler_with_response_should_inherit_from_IRequestHandler()
    {
        // Act & Assert
        typeof(ICommandHandler<TestCommand, Result<string>>).Should()
            .BeAssignableTo<IRequestHandler<TestCommand, Result<string>>>(
                "ICommandHandler<TCommand, TResponse> should inherit from MediatR IRequestHandler");
    }

    [Fact]
    public void IQueryHandler_should_inherit_from_IRequestHandler()
    {
        // Act & Assert
        typeof(IQueryHandler<TestQuery, Result<string>>).Should()
            .BeAssignableTo<IRequestHandler<TestQuery, Result<string>>>(
                "IQueryHandler should inherit from MediatR IRequestHandler");
    }
}

// Test implementations to verify the interfaces work correctly
