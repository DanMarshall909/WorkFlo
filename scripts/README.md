# WorkFlo Project Scripts

This directory contains automation scripts to ensure code quality, enforce branch strategy, and streamline development workflows.

## 🛡️ Push Rules Enforcement

The repository enforces a strict dev branch strategy with comprehensive push rules. See [Push Rules Setup Guide](./README-push-rules.md) for complete installation and configuration.

### Quick Setup

```bash
# Install pre-push hook (recommended)
cp scripts/pre-push-hook .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

### Available Files

- `pre-push-hook` - Local git hook to catch violations before push
- `README-push-rules.md` - Complete setup and troubleshooting guide
- `pr-quality-check.sh --pre-push` - Lightweight quality checks for pre-push

## 🚀 PR Quality Check Script

The PR Quality Check script runs comprehensive quality checks before submitting pull requests to ensure code meets project standards.

### Prerequisites

1. **Install .NET SDK 8.0+**

   ```bash
   # Windows (via winget)
   winget install Microsoft.DotNet.SDK.8

   # macOS (via Homebrew)
   brew install dotnet

   # Linux (Ubuntu/Debian)
   wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
   sudo dpkg -i packages-microsoft-prod.deb
   sudo apt-get update && sudo apt-get install -y dotnet-sdk-8.0
   ```

2. **Install ReSharper Command Line Tools** (Required for comprehensive analysis)

   ```bash
   dotnet tool install -g JetBrains.ReSharper.GlobalTools
   ```

   Verify installation:

   ```bash
   jb --version
   ```

3. **Install Code Coverage Tools** (Optional but recommended)
   ```bash
   dotnet tool install -g dotnet-reportgenerator-globaltool
   ```

### Usage

#### PowerShell (Windows/Cross-platform)

```powershell
# Run all checks
./scripts/pr-quality-check.ps1

# Skip tests for quick checks
./scripts/pr-quality-check.ps1 -SkipTests

# Skip coverage analysis
./scripts/pr-quality-check.ps1 -SkipCoverage

# Custom report location
./scripts/pr-quality-check.ps1 -OutputPath "./my-custom-report.html"

# Show help
./scripts/pr-quality-check.ps1 -?
```

#### Bash (Linux/macOS/WSL)

```bash
# Make script executable (first time only)
chmod +x scripts/pr-quality-check.sh

# Run all checks
./scripts/pr-quality-check.sh

# Skip tests for quick checks
./scripts/pr-quality-check.sh --skip-tests

# Skip coverage analysis
./scripts/pr-quality-check.sh --skip-coverage

# Custom report location
./scripts/pr-quality-check.sh --output-path "./my-custom-report.html"

# Show help
./scripts/pr-quality-check.sh --help
```

### Quality Checks Performed

| Check                  | Description                             | Failure Criteria                  | Tools Used                                    |
| ---------------------- | --------------------------------------- | --------------------------------- | --------------------------------------------- |
| **Tool Verification**  | Ensures required tools are installed    | Missing .NET SDK or ReSharper CLI | `dotnet --version`, `jb --version`            |
| **Clean & Restore**    | Cleans and restores NuGet packages      | Restore failures                  | `dotnet clean`, `dotnet restore`              |
| **Build Verification** | Compiles the entire solution            | Build errors                      | `dotnet build`                                |
| **Code Formatting**    | Verifies code formatting standards      | Unformatted code                  | `dotnet format --verify-no-changes`           |
| **ReSharper Analysis** | Comprehensive code quality analysis     | >10 code issues                   | `jb inspectcode`                              |
| **Security Scan**      | Scans for potential secrets/credentials | Hardcoded secrets found           | Custom regex patterns                         |
| **Unit Tests**         | Runs all unit tests                     | Any test failures                 | `dotnet test`                                 |
| **Code Coverage**      | Measures test coverage                  | <60% line coverage                | `dotnet test --collect:"XPlat Code Coverage"` |
| **Documentation**      | Checks required documentation files     | Missing critical docs             | File existence checks                         |
| **Git Status**         | Reports working directory status        | Information only                  | `git status`                                  |

### Quality Thresholds

#### ✅ Pass Criteria

- **Build**: No compilation errors
- **Code Formatting**: All files properly formatted
- **ReSharper**: ≤10 code issues
- **Unit Tests**: 100% test pass rate
- **Code Coverage**: ≥80% line coverage (≥60% minimum)
- **Security**: No hardcoded secrets detected

#### ⚠️ Warning Criteria

- **Build**: Build warnings present
- **ReSharper**: 1-10 code issues
- **Code Coverage**: 60-79% line coverage
- **Security**: Potential secrets requiring manual review
- **Documentation**: Non-critical documentation missing

#### ❌ Fail Criteria

- **Build**: Compilation errors
- **Code Formatting**: Unformatted code
- **ReSharper**: >10 code issues
- **Unit Tests**: Any test failures
- **Code Coverage**: <60% line coverage
- **Security**: Confirmed hardcoded secrets

### Generated Reports

The script generates a comprehensive HTML report with:

- **Executive Summary**: Overall status and metrics
- **Detailed Results**: Per-check status and descriptions
- **Recommendations**: Actionable steps to fix issues
- **Timestamps**: When checks were performed
- **Output Files**: Links to detailed tool outputs

Report includes:

- ✅ Visual status indicators
- 📊 Summary statistics
- 🔗 Direct links to tool outputs
- 📱 Mobile-friendly responsive design

### Integration with Development Workflow

#### Local Development

```bash
# Before committing changes
./scripts/pr-quality-check.sh

# Quick check during development
./scripts/pr-quality-check.sh --skip-tests --skip-coverage
```

#### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Quality Checks
  run: |
    chmod +x scripts/pr-quality-check.sh
    ./scripts/pr-quality-check.sh

- name: Upload Quality Report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: quality-report
    path: reports/pr-quality-report.html
```

#### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
./scripts/pr-quality-check.sh --skip-tests
exit $?
```

### Troubleshooting

#### Common Issues

1. **ReSharper CLI Not Found**

   ```bash
   # Reinstall ReSharper CLI tools
   dotnet tool uninstall -g JetBrains.ReSharper.GlobalTools
   dotnet tool install -g JetBrains.ReSharper.GlobalTools

   # Verify installation
   jb --version
   ```

2. **Permission Denied (Linux/macOS)**

   ```bash
   chmod +x scripts/pr-quality-check.sh
   ```

3. **PowerShell Execution Policy (Windows)**

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Coverage Report Not Generated**

   ```bash
   # Install coverage tools
   dotnet add package coverlet.msbuild
   ```

5. **Build Failures**
   ```bash
   # Clean and restore
   dotnet clean
   dotnet restore
   dotnet build
   ```

#### Environment-Specific Notes

- **Windows**: Use PowerShell script for best experience
- **Linux/macOS**: Use Bash script, ensure proper permissions
- **WSL**: Either script works, Bash recommended
- **Docker**: Mount scripts directory and run inside container

### Customization

#### Adding Custom Checks

1. Create new check function in script
2. Add to check execution sequence
3. Update quality thresholds
4. Add documentation

#### Modifying Thresholds

Edit the following variables in the script:

- `RESHARPER_ISSUE_THRESHOLD=10`
- `COVERAGE_MINIMUM=60`
- `COVERAGE_TARGET=80`

#### Custom Report Templates

Modify the HTML generation section to customize report appearance and content.

### Performance Tips

- Use `--skip-tests` for quick formatting/build checks
- Run coverage analysis only before final PR submission
- Use `--skip-coverage` on resource-constrained environments
- Run ReSharper analysis periodically, not on every commit

### Support

For issues with the quality check script:

1. Check prerequisites are installed
2. Review troubleshooting section
3. Check script permissions
4. Verify tool versions match requirements
5. Create issue in project repository

**Tool Versions:**

- .NET SDK: 8.0+
- ReSharper CLI: Latest stable
- PowerShell: 7.0+ (for PS script)
- Bash: 4.0+ (for Bash script)
