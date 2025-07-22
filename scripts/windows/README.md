# WorkFlo Windows Scripts

This directory contains Windows installation scripts and build tools for WorkFlo - an AI-powered workflow enforcement tool for development teams.

## For Developers: Building Windows Releases

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- Git

### Build Commands

**PowerShell:**
```powershell
# Build Windows release binaries
.\scripts\windows\build-release.ps1

# Build with options
.\scripts\windows\build-release.ps1 -OutputPath "dist\windows" -Clean
```

**Linux/macOS:**
```bash
# Cross-compile Windows binaries
./scripts/windows/build-release.sh

# Build with options  
./scripts/windows/build-release.sh --output-path "dist/windows" --clean
```

This creates a complete Windows distribution in `build/windows/` with:
- Self-contained executables (CLI + API)
- Next.js production frontend
- Installation scripts
- Documentation

---

## For End Users: Installing WorkFlo

## Quick Installation

### Option 1: PowerShell (Recommended)
1. **Run as Administrator**: Right-click PowerShell and select "Run as administrator"
2. **Execute the script**:
   ```powershell
   .\install.ps1
   ```

### Option 2: Batch File
1. **Run as Administrator**: Right-click Command Prompt and select "Run as administrator"
2. **Execute the script**:
   ```cmd
   install.bat
   ```

## What Gets Installed

- **WorkFlo CLI** (`cli/`) - Command-line interface for workflow enforcement
- **WorkFlo API** (`api/`) - Backend API server for real-time validation
- **WorkFlo Web** (`web/`) - Next.js frontend for dashboard and configuration
- **Configuration** - Default settings with SQLite database setup
- **Desktop Shortcuts** - Quick access to CLI and API server
- **System PATH** - Global access to `workflo` command

## Installation Details

### Default Installation Path
```
C:\Program Files\WorkFlo\
├── cli/           # Command-line interface
├── api/           # API server
├── web/           # Web frontend
├── data/          # SQLite database directory
└── workflo-config.json
```

### System Changes
- Adds `C:\Program Files\WorkFlo\cli` to system PATH
- Creates desktop shortcuts for CLI and API
- Optionally installs API as Windows service

## Post-Installation Setup

### 1. Verify Installation
Open a new terminal and run:
```cmd
workflo --help
```

### 2. Initialize in Git Repository
Navigate to your git repository and run:
```cmd
workflo install
```
This sets up git hooks for commit validation.

### 3. Start API Server
**Option A: Manual Start**
```cmd
workflo serve
```

**Option B: Install as Windows Service**
Run as administrator:
```cmd
"C:\Program Files\WorkFlo\install-service.bat"
```

### 4. Access Web Interface
Once the API is running, access the web interface at:
- http://localhost:5016 (API endpoints)
- Deploy the web frontend separately or serve static files

## Database Setup

WorkFlo uses SQLite by default with automatic database creation:
- **Database Location**: `C:\Program Files\WorkFlo\data\workflo.db`
- **Auto-Migration**: Enabled by default
- **No Manual Setup Required**: Database is created on first run

## Configuration

Edit `workflo-config.json` to customize settings:

```json
{
  "ApiUrl": "http://localhost:5016",
  "WebUrl": "http://localhost:3000",
  "DefaultSettings": {
    "AutoStartApi": true,
    "EnableLogging": true,
    "LogLevel": "Information",
    "DatabaseProvider": "SQLite"
  },
  "Database": {
    "ConnectionString": "Data Source=C:\\Program Files\\WorkFlo\\data\\workflo.db",
    "AutoMigrate": true
  }
}
```

## Usage Examples

### Basic Commands
```cmd
# Show help
workflo --help

# Install git hooks in current repository
workflo install

# Start API server
workflo serve

# Run quality checks
workflo quality check

# Validate commit message
workflo validate commit-msg "feat: add new feature"
```

### Git Hook Integration
After running `workflo install`, the following hooks are active:
- **pre-commit**: Validates code quality and TDD cycles
- **commit-msg**: Enforces conventional commit message format
- **pre-push**: Runs comprehensive validation before push

## Troubleshooting

### Common Issues

**1. "workflo command not found"**
- Restart your terminal after installation
- Verify PATH includes `C:\Program Files\WorkFlo\cli`

**2. "Access denied" during installation**
- Run installation script as administrator
- Ensure you have write permissions to Program Files

**3. API server won't start**
- Check if port 5016 is available
- Verify no firewall blocking the application
- Check logs in the installation directory

**4. Database connection issues**
- Ensure `data` directory exists and is writable
- Check database connection string in config file
- Verify SQLite support is available

### Log Files
- **CLI Logs**: Console output during command execution
- **API Logs**: Written to console when running `workflo serve`
- **Service Logs**: Windows Event Viewer when running as service

## Uninstallation

To remove WorkFlo completely:

**PowerShell:**
```powershell
C:\Program Files\WorkFlo\uninstall.ps1
```

**Batch:**
```cmd
"C:\Program Files\WorkFlo\uninstall.bat"
```

This will:
- Stop and remove Windows service
- Remove from system PATH
- Delete desktop shortcuts
- Remove installation directory
- Clean up registry entries

## System Requirements

- **OS**: Windows 10/11 or Windows Server 2019+
- **Architecture**: x64 (64-bit)
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 500MB free space
- **Network**: Internet access for initial setup and updates

## Security Notes

- Installation requires administrator privileges
- API server runs on localhost by default
- SQLite database is stored locally
- No external dependencies or telemetry
- All communication is local unless configured otherwise

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main WorkFlo documentation
3. Contact the development team

---

**WorkFlo - Enforcing excellence in development workflows**