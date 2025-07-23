# WorkFlo

**AI-powered workflow enforcement for development teams**

WorkFlo is a comprehensive development workflow enforcement tool that combines intelligent git hooks, TDD validation, and AI-powered suggestions to maintain code quality and development standards.

## Features

- **Smart Git Hooks**: HTTP-based pre-commit, commit-msg, and pre-push validation
- **TDD Workflow Enforcement**: Automated validation of Test-Driven Development cycles
- **AI-Powered CLI**: Command-line interface with quality analysis and workflow automation
- **Local API Server**: Real-time validation and communication between tools
- **Configuration Management**: Flexible JSON-based configuration system

## Quick Start

### Installation

```bash
# Install WorkFlo CLI globally
dotnet tool install --global WorkFlo.Cli

# Install git hooks in your repository
workflo install
```

### Usage

```bash
# Start the API server
workflo serve

# Run quality checks
workflo quality check

# Validate commit messages
workflo validate commit-msg "feat: add new feature"
```

## Architecture

- **API Server**: ASP.NET Core with FastEndpoints
- **CLI Tool**: .NET 9 with System.CommandLine
- **Frontend**: Next.js with React and TypeScript
- **Database**: Entity Framework Core with SQLite

## Development

### Prerequisites

- .NET 9 SDK
- Node.js 18+
- Git

### Building

```bash
# Build backend
dotnet build

# Build frontend
cd src/web && npm install && npm run build
```

### Testing

```bash
# Run backend tests
dotnet test

# Run frontend tests
cd src/web && npm test
```

## License

**Copyright (c) 2025 Dan Marshall. All rights reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. See the [LICENSE](LICENSE) file for complete terms and conditions.

## Contact

For licensing inquiries or support, please contact Dan Marshall.

---

*WorkFlo - Enforcing excellence in development workflows*