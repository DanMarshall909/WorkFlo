#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[→]${NC} $1"
}

# Track changes for commit
CHANGES_MADE=false

# Function to commit changes if any were made
commit_if_changed() {
    if [ "$CHANGES_MADE" = true ]; then
        git add -A
        git commit -m "$1"
        print_status "Committed: $1"
        CHANGES_MADE=false
    fi
}

print_info "Continuing Technical Debt Cleanup (Issue #8) - Part 2"

# 9. Standardize ConfigureAwait(false) usage
print_info "Standardizing ConfigureAwait(false) usage"
CONFIG_AWAIT_FIXED=0

# Find all C# files with async/await
find src -name "*.cs" -type f | while read -r file; do
    # Skip generated files and designer files
    if [[ "$file" =~ \.(g|designer)\.cs$ ]]; then
        continue
    fi
    
    # Check if file contains await without ConfigureAwait
    if grep -q "await " "$file"; then
        # Create a temporary file for safe editing
        temp_file=$(mktemp)
        
        # Process the file line by line
        while IFS= read -r line; do
            # Check if line contains await and doesn't already have ConfigureAwait
            if [[ "$line" =~ await[[:space:]]+ ]] && [[ ! "$line" =~ ConfigureAwait ]]; then
                # Add ConfigureAwait(false) before the semicolon
                modified_line=$(echo "$line" | sed 's/\(await[^;]*\);/\1.ConfigureAwait(false);/g')
                echo "$modified_line" >> "$temp_file"
                if [ "$line" != "$modified_line" ]; then
                    ((CONFIG_AWAIT_FIXED++)) || true
                fi
            else
                echo "$line" >> "$temp_file"
            fi
        done < "$file"
        
        # Replace original file if changes were made
        if ! cmp -s "$file" "$temp_file"; then
            mv "$temp_file" "$file"
            CHANGES_MADE=true
        else
            rm "$temp_file"
        fi
    fi
done

if [ $CONFIG_AWAIT_FIXED -gt 0 ]; then
    print_status "Added ConfigureAwait(false) to $CONFIG_AWAIT_FIXED instances"
    commit_if_changed "fix: standardize ConfigureAwait(false) usage across async methods"
else
    print_status "No ConfigureAwait(false) changes needed"
fi

# 10. Create base handler classes for CQRS
print_info "Creating base handler classes"
mkdir -p src/WorkFlo.Application/Common/CQRS

# Create base command handler
if [ ! -f "src/WorkFlo.Application/Common/CQRS/BaseCommandHandler.cs" ]; then
    cat > src/WorkFlo.Application/Common/CQRS/BaseCommandHandler.cs << 'EOF'
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
EOF
    CHANGES_MADE=true
fi

# Create base query handler
if [ ! -f "src/WorkFlo.Application/Common/CQRS/BaseQueryHandler.cs" ]; then
    cat > src/WorkFlo.Application/Common/CQRS/BaseQueryHandler.cs << 'EOF'
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
EOF
    CHANGES_MADE=true
fi

commit_if_changed "feat: add base handler classes for CQRS pattern"

# 11. Create ARCHITECTURE.md
print_info "Creating architecture documentation"
mkdir -p docs

if [ ! -f "docs/ARCHITECTURE.md" ]; then
    cat > docs/ARCHITECTURE.md << 'EOF'
# WorkFlo Architecture

## Overview

WorkFlo is built using Clean Architecture principles with CQRS pattern, ensuring separation of concerns and maintainability.

## Architecture Layers

### Domain Layer (`WorkFlo.Domain`)
- Contains business logic and domain entities
- No dependencies on other layers
- Defines interfaces for repositories and services
- Contains validation rules and domain events

### Application Layer (`WorkFlo.Application`)
- Contains application business rules
- Implements CQRS with MediatR
- Defines commands, queries, and their handlers
- Contains DTOs and mapping logic
- Orchestrates the flow of data

### Infrastructure Layer (`WorkFlo.Infrastructure`)
- Implements interfaces defined in Domain layer
- Contains data access implementations
- External service integrations
- Cross-cutting concerns (logging, caching)

### API Layer (`WorkFlo.Api`)
- RESTful API using FastEndpoints
- Handles HTTP requests/responses
- Authentication and authorization
- API documentation (OpenAPI/Swagger)

### CLI Layer (`WorkFlo.Cli`)
- Command-line interface for local development
- Git hook management
- Workflow validation rules
- Local-first operation

## Design Patterns

### CQRS (Command Query Responsibility Segregation)
- Commands: Modify state (prefix: `C`)
- Queries: Read state (prefix: `Q`)
- Handlers: Process commands/queries (prefix: `H`)

### Repository Pattern
- Abstracts data access logic
- Enables unit testing with mocks
- Supports multiple data sources

### Result Pattern
- Type-safe error handling using `TypeSafeResult<T, TError>`
- Explicit success/failure paths
- No exceptions for control flow

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock external dependencies
- Focus on business logic
- Target: 95% code coverage

### Integration Tests
- Test component interactions
- Use test doubles for external services
- Verify API contracts
- Test database operations

### Test Organization
- `WorkFlo.Tests.Common`: Shared test utilities
- `*.Tests` projects: Layer-specific tests
- Test naming: Business scenarios, not technical details

## API Design

### FastEndpoints
- Minimal API approach
- Request/Response DTOs
- Built-in validation
- OpenAPI documentation

### Authentication
- JWT-based authentication
- OAuth integration (Google, Microsoft)
- Refresh token rotation
- Role-based authorization

## Database

### Entity Framework Core
- Code-first migrations
- Repository pattern implementation
- Soft deletes for audit trail
- Optimistic concurrency control

## Frontend Integration

### API Client Generation
- TypeScript client auto-generated from OpenAPI
- Type-safe API calls
- Automatic during build process

## Security Considerations

- Input validation at all layers
- SQL injection prevention via EF Core
- XSS protection in API responses
- Rate limiting for public endpoints
- Secure token storage
- HTTPS enforcement

## Performance Considerations

- Async/await throughout
- ConfigureAwait(false) for better performance
- Response caching where appropriate
- Database query optimization
- Pagination for large datasets

## Deployment

### Local Development
- CLI for git hook management
- Local API server
- Hot reload support

### Production
- Docker containerization
- Health checks
- Structured logging
- Monitoring and alerting
EOF
    CHANGES_MADE=true
    print_status "Created architecture documentation"
fi

commit_if_changed "docs: add comprehensive architecture documentation"

# 12. Add XML documentation template
print_info "Creating XML documentation example"
if [ ! -f "docs/XML_DOCUMENTATION_GUIDE.md" ]; then
    cat > docs/XML_DOCUMENTATION_GUIDE.md << 'EOF'
# XML Documentation Guide

## Overview
This guide provides examples of how to properly document public APIs in WorkFlo.

## Examples

### Classes
```csharp
/// <summary>
/// Represents a validation rule for git commits.
/// </summary>
/// <remarks>
/// This class implements the IValidationRule interface to provide
/// custom validation logic for git commits in the WorkFlo system.
/// </remarks>
public class CommitValidationRule : IValidationRule
{
    // Implementation
}
```

### Methods
```csharp
/// <summary>
/// Validates the provided git commit message against configured rules.
/// </summary>
/// <param name="message">The commit message to validate.</param>
/// <param name="cancellationToken">Token to cancel the operation.</param>
/// <returns>A validation result indicating success or failure with error details.</returns>
/// <exception cref="ArgumentNullException">Thrown when message is null.</exception>
public async Task<ValidationResult> ValidateAsync(string message, CancellationToken cancellationToken)
{
    // Implementation
}
```

### Properties
```csharp
/// <summary>
/// Gets or sets the maximum number of files allowed in a single commit.
/// </summary>
/// <value>
/// The maximum file count. Default is 3.
/// </value>
public int MaxFileCount { get; set; } = 3;
```

### Interfaces
```csharp
/// <summary>
/// Defines the contract for validation rules in the WorkFlo system.
/// </summary>
public interface IValidationRule
{
    /// <summary>
    /// Validates the input according to the rule's logic.
    /// </summary>
    /// <param name="input">The input to validate.</param>
    /// <returns>True if validation passes; otherwise, false.</returns>
    bool Validate(string input);
}
```

## Best Practices

1. Always document public APIs
2. Use complete sentences with proper punctuation
3. Include parameter descriptions for all parameters
4. Document return values clearly
5. List possible exceptions
6. Add remarks for complex behavior
7. Include code examples for complex APIs
EOF
    CHANGES_MADE=true
    print_status "Created XML documentation guide"
fi

commit_if_changed "docs: add XML documentation guide"

# Final summary
print_info "Technical Debt Cleanup Part 2 Summary:"
print_status "✓ Standardized ConfigureAwait(false) usage"
print_status "✓ Created base handler classes for CQRS"
print_status "✓ Created architecture documentation"
print_status "✓ Created XML documentation guide"

print_info "Technical Debt Cleanup Complete!"
echo ""
print_info "Next steps:"
echo "  - Run tests to ensure everything still works: dotnet test"
echo "  - Review the generated documentation in the docs/ folder"
echo "  - Update existing handlers to inherit from base classes"
echo "  - Add XML documentation to all public APIs"
echo "  - Implement the standardized TypeSafeResult pattern throughout"
echo "  - Add comprehensive unit tests for CLI services"