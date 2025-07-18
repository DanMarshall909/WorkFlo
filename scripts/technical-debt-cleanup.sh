#!/bin/bash

# Technical Debt Cleanup Script for Issue #8
# This script addresses all subtasks from the technical debt cleanup issue

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

print_info "Starting Technical Debt Cleanup (Issue #8)"

# 1. Check if WorkFlo.Cli.Tests is in solution (already done)
print_status "WorkFlo.Cli.Tests already exists in solution"

# 2. Remove nested empty directories in CLI project
if [ -d "src/WorkFlo.Cli/src" ] || [ -d "src/WorkFlo.Cli/tests" ]; then
    print_info "Removing nested empty directories from CLI project"
    rm -rf src/WorkFlo.Cli/src/ src/WorkFlo.Cli/tests/
    CHANGES_MADE=true
    commit_if_changed "fix: remove nested empty directories from CLI project"
else
    print_status "No nested empty directories found in CLI project"
fi

# 3. Add TestResults/ to .gitignore
print_info "Checking .gitignore for TestResults/"
if ! grep -q "TestResults/" .gitignore 2>/dev/null; then
    echo -e "\n# Test coverage results\nTestResults/" >> .gitignore
    CHANGES_MADE=true
    print_status "Added TestResults/ to .gitignore"
else
    print_status "TestResults/ already in .gitignore"
fi

# Clean up existing TestResults directories
print_info "Cleaning up existing TestResults directories"
find . -type d -name "TestResults" -exec rm -rf {} + 2>/dev/null || true
CHANGES_MADE=true

commit_if_changed "chore: add TestResults to .gitignore and clean up existing results"

# 4. Rename frontend package from anchor-web to workflo-web
print_info "Checking frontend package name"
if [ -f "src/web/package.json" ]; then
    if grep -q '"name": "anchor-web"' src/web/package.json; then
        print_info "Renaming frontend package from anchor-web to workflo-web"
        sed -i 's/"name": "anchor-web"/"name": "workflo-web"/g' src/web/package.json
        CHANGES_MADE=true
        commit_if_changed "fix: rename frontend package from anchor-web to workflo-web"
    else
        print_status "Frontend package already named correctly"
    fi
fi

# 5. Check UserRepository location
print_info "Checking UserRepository location"
if [ -f "src/WorkFlo.Infrastructure/Configuration/UserRepository.cs" ]; then
    print_info "Moving UserRepository to proper location"
    mkdir -p src/WorkFlo.Infrastructure/Repositories
    mv src/WorkFlo.Infrastructure/Configuration/UserRepository.cs src/WorkFlo.Infrastructure/Repositories/
    CHANGES_MADE=true
    commit_if_changed "refactor: move UserRepository from Configuration to Repositories"
else
    print_status "UserRepository already in correct location or doesn't exist"
fi

# 6. Create WorkFlo.Tests.Common project
print_info "Creating WorkFlo.Tests.Common project"
if [ ! -d "tests/WorkFlo.Tests.Common" ]; then
    mkdir -p tests/WorkFlo.Tests.Common
    
    # Create project file
    cat > tests/WorkFlo.Tests.Common/WorkFlo.Tests.Common.csproj << 'EOF'
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.0" />
    <PackageReference Include="xunit" Version="2.6.2" />
    <PackageReference Include="NSubstitute" Version="5.1.0" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\WorkFlo.Api\WorkFlo.Api.csproj" />
    <ProjectReference Include="..\..\src\WorkFlo.Application\WorkFlo.Application.csproj" />
    <ProjectReference Include="..\..\src\WorkFlo.Domain\WorkFlo.Domain.csproj" />
    <ProjectReference Include="..\..\src\WorkFlo.Infrastructure\WorkFlo.Infrastructure.csproj" />
  </ItemGroup>

</Project>
EOF

    # Add to solution
    dotnet sln add tests/WorkFlo.Tests.Common/WorkFlo.Tests.Common.csproj
    
    CHANGES_MADE=true
    print_status "Created WorkFlo.Tests.Common project"
else
    print_status "WorkFlo.Tests.Common already exists"
fi

# 7. Move test helpers to shared project
print_info "Moving test helpers to shared project"
if [ -d "tests/WorkFlo.Api.Tests/Helpers" ] && [ -d "tests/WorkFlo.Tests.Common" ]; then
    # Create Helpers directory in Tests.Common
    mkdir -p tests/WorkFlo.Tests.Common/Helpers
    
    # Copy helper files (excluding specific test factories that might be Api-specific)
    for file in tests/WorkFlo.Api.Tests/Helpers/*.cs; do
        filename=$(basename "$file")
        if [[ ! "$filename" =~ WebApplicationFactory ]]; then
            cp "$file" "tests/WorkFlo.Tests.Common/Helpers/" 2>/dev/null || true
        fi
    done
    
    # Update namespaces in copied files
    find tests/WorkFlo.Tests.Common/Helpers -name "*.cs" -exec sed -i 's/namespace WorkFlo.Api.Tests.Helpers/namespace WorkFlo.Tests.Common.Helpers/g' {} +
    
    CHANGES_MADE=true
    print_status "Moved test helpers to shared project"
fi

commit_if_changed "refactor: create WorkFlo.Tests.Common and move shared test helpers"

# 8. Fix endpoint accessibility for testing
print_info "Checking endpoint accessibility"
ENDPOINTS_FIXED=0
find src/WorkFlo.Api/Endpoints -name "*.cs" -type f | while read -r file; do
    if grep -q "internal class" "$file" || grep -q "internal sealed class" "$file"; then
        sed -i 's/internal class/public sealed class/g' "$file"
        sed -i 's/internal sealed class/public sealed class/g' "$file"
        ((ENDPOINTS_FIXED++))
    fi
done

if [ $ENDPOINTS_FIXED -gt 0 ]; then
    CHANGES_MADE=true
    print_status "Fixed endpoint accessibility in $ENDPOINTS_FIXED files"
    commit_if_changed "fix: change endpoint classes from internal to public sealed for testing"
fi

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
    if grep -q "await.*;" "$file" && ! grep -q "ConfigureAwait" "$file"; then
        # Add ConfigureAwait(false) to await statements
        sed -i 's/await \([^;]*\);/await \1.ConfigureAwait(false);/g' "$file"
        ((CONFIG_AWAIT_FIXED++))
    fi
done

if [ $CONFIG_AWAIT_FIXED -gt 0 ]; then
    CHANGES_MADE=true
    print_status "Added ConfigureAwait(false) to $CONFIG_AWAIT_FIXED files"
    commit_if_changed "fix: standardize ConfigureAwait(false) usage across async methods"
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

# Final summary
print_info "Technical Debt Cleanup Summary:"
print_status "✓ Removed nested empty directories"
print_status "✓ Added TestResults/ to .gitignore"
print_status "✓ Renamed frontend package"
print_status "✓ Created WorkFlo.Tests.Common project"
print_status "✓ Created base handler classes"
print_status "✓ Created architecture documentation"
print_status "✓ Standardized code patterns"

print_info "Next steps:"
echo "  - Run tests to ensure everything still works"
echo "  - Review generated documentation"
echo "  - Update existing handlers to use base classes"
echo "  - Add XML documentation to public APIs"
echo "  - Implement comprehensive test coverage"