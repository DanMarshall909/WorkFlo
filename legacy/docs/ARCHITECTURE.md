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
