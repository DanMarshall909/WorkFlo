# Pre-Commit Quality Gate System

## Overview

The pre-commit quality gate enforces local quality checks before allowing commits, ensuring that code quality standards are maintained at the development level rather than just in CI/CD.

## Features

### 🔍 **Quality Checks Enforced**
- **ReSharper Analysis**: Code must have zero ReSharper issues (zero tolerance policy)
- **Test Results**: All tests must pass
- **Code Formatting**: Code must be properly formatted (`dotnet format`)
- **Report Freshness**: Quality reports must be newer than code changes

### 🛡️ **Safety Features**
- **Automatic Backup**: Existing pre-commit hooks are backed up
- **Merge Commit Bypass**: Quality gate skipped for merge commits
- **Emergency Override**: Can be bypassed with environment variable
- **Tool Verification**: Checks for required tools before running

## Installation

### Quick Install
```bash
./scripts/install-pre-commit-quality-gate.sh
```

### Manual Verification
```bash
# Check if hook is installed
ls -la .git/hooks/pre-commit

# Test hook manually
.git/hooks/pre-commit
```

## Usage

### Normal Development Flow
```bash
# 1. Make code changes
git add .

# 2. Run quality check to generate fresh reports
./scripts/pr-quality-check.sh

# 3. Commit (quality gate runs automatically)
git commit -m "feat: implement new feature"
```

### Quality Gate Workflow
```
git commit
    ↓
Pre-commit hook executes
    ↓
Checks for:
├── Required tools (jb, dotnet)
├── Fresh reports existence
├── ReSharper issues (≤10)
├── Test results (all pass)
└── Code formatting
    ↓
✅ Pass: Commit proceeds
❌ Fail: Commit blocked with guidance
```

## Emergency Bypass

### Temporary Override
```bash
# For emergency commits only
SKIP_QUALITY_GATE=true git commit -m "hotfix: critical production issue"
```

### Permanent Disable
```bash
# Uninstall the hook
./scripts/install-pre-commit-quality-gate.sh --uninstall

# Or remove manually
rm .git/hooks/pre-commit
```

## Quality Standards

### ReSharper Analysis
- **Threshold**: Zero issues allowed (zero tolerance policy)
- **Report Location**: `reports/resharper-report.xml`  
- **Check Command**: `jb inspectcode`

### Test Requirements
- **Standard**: All tests must pass
- **Report Location**: `reports/test-results.trx`
- **Check Command**: `dotnet test`

### Code Formatting
- **Standard**: Must pass `dotnet format --verify-no-changes`
- **Auto-fix**: Run `dotnet format` to fix issues
- **Scope**: All C# files in solution

### Report Freshness
- **Rule**: Reports must be newer than most recent code change
- **Monitored Files**: `*.cs`, `*.csproj`, `*.sln`
- **Excluded**: Files in `reports/` directory

## Troubleshooting

### Common Issues

#### 1. Missing ReSharper CLI Tools
```bash
# Install globally
dotnet tool install -g JetBrains.ReSharper.GlobalTools

# Verify installation
jb --version
```

#### 2. Outdated Reports
```bash
# Generate fresh reports
./scripts/pr-quality-check.sh

# Check report timestamps
ls -la reports/
```

#### 3. Formatting Issues
```bash
# Fix formatting automatically
dotnet format

# Verify formatting
dotnet format --verify-no-changes
```

#### 4. Test Failures
```bash
# Run tests and view results
dotnet test --logger trx --results-directory reports/

# Check specific failures
cat reports/test-results.trx | grep -A5 "Failed"
```

### Debug Mode
```bash
# Run quality gate manually for debugging
./scripts/pre-commit-quality-gate.sh

# Check reports manually
ls -la reports/
cat reports/pr-quality-report.html
```

## Configuration

### Customizing Thresholds

Edit `scripts/pre-commit-quality-gate.sh`:

```bash
# ReSharper issues threshold (currently zero tolerance)
local max_allowed_issues=0  # Zero tolerance policy

# Add additional checks
check_custom_rules() {
    # Your custom quality checks here
}
```

### Integration with IDEs

#### JetBrains Rider
1. Enable "Reformat code" on save
2. Enable "Optimize imports" on save
3. Configure ReSharper inspections
4. Set up commit hooks in VCS settings

#### VS Code
1. Install C# Dev Kit extension
2. Enable "format on save"
3. Configure EditorConfig support
4. Set up tasks for quality checks

## Best Practices

### Development Workflow
1. **Run quality checks frequently** during development
2. **Fix issues immediately** rather than accumulating them
3. **Generate fresh reports** before committing
4. **Use meaningful commit messages** that explain changes

### Team Guidelines
1. **Never bypass quality gate** except for emergencies
2. **Document any quality exceptions** in commit messages
3. **Keep ReSharper issues below threshold** consistently
4. **Maintain test coverage** above minimum standards

### Maintenance
1. **Update quality check script** as standards evolve
2. **Review and adjust thresholds** based on team capabilities
3. **Monitor quality metrics** over time
4. **Share knowledge** about quality tools and practices

## Advanced Usage

### Custom Quality Checks
```bash
# Add custom function to pre-commit-quality-gate.sh
check_custom_standards() {
    print_info "Checking custom standards..."
    
    # Example: Check for TODO comments in production code
    if grep -r "TODO" src/ --include="*.cs" | grep -v Test; then
        print_error "TODO comments found in production code"
        return 1
    fi
    
    print_success "Custom standards passed"
    return 0
}

# Add to main quality gate function
run_quality_gate() {
    # ... existing checks ...
    check_custom_standards
}
```

### Integration with CI/CD
The quality gate complements CI/CD by catching issues early:

```yaml
# Example GitHub Actions workflow
name: Quality Gate Verification
on: [push, pull_request]

jobs:
  verify-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Verify Quality Reports
        run: |
          # Ensure quality gate would pass
          ./scripts/pre-commit-quality-gate.sh
```

## Support

### Getting Help
1. **Check this documentation** first
2. **Run manual debugging** with quality gate script
3. **Review error messages** carefully - they include guidance
4. **Check tool installations** and versions

### Reporting Issues
When reporting quality gate issues, include:
- Error message from the hook
- Contents of `reports/` directory
- Output of `./scripts/pr-quality-check.sh`
- Git commit history context

## 🏗️ Architectural Documentation Maintenance

The quality system automatically maintains the architectural summary document:

### Manual Architecture Documentation Commands

```bash
# Check architecture documentation status
./scripts/update-architecture-doc.sh --check

# Update timestamps and version info
./scripts/update-architecture-doc.sh --update

# Analyze recent changes for doc updates
./scripts/update-architecture-doc.sh --analyze

# Run all operations (default)
./scripts/update-architecture-doc.sh
```

### Automatic Maintenance

The architecture documentation is automatically maintained:

1. **During PR Checks**: The PR quality script checks if the architecture doc needs updates
2. **During Claude Reviews**: After successful quality fixes, documentation metadata is updated
3. **Change Detection**: The system detects changes to domain models, CQRS patterns, and infrastructure

### What Gets Updated

- **Metadata**: Last updated date and current version
- **Change Analysis**: Detection of significant architectural changes
- **Maintenance Reminders**: Warnings when documentation may be outdated

The architectural summary is located at `docs/architectural-summary.md` and includes:
- Mermaid diagrams of system architecture
- Technology stack documentation  
- CQRS and Clean Architecture patterns
- Domain-driven design implementation
- Tips, traps, and best practices
- External learning resources and links

### Testing the Architecture System

```bash
# Test the Claude Quality Reviewer manually
./scripts/test-claude-reviewer.sh

# This runs through the complete quality review process including:
# - Code analysis and fixing
# - Architecture documentation updates
# - Report generation
```

---

**Remember**: The quality gate is designed to help maintain code quality and catch issues early. It's a development aid, not an obstacle! 🛡️✨