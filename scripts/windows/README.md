# WorkFlo Windows CLI (WSL Integration)

This directory contains Windows CLI installation scripts for WorkFlo - an AI-powered workflow enforcement tool that runs with WSL API integration.

## Architecture Overview

**WorkFlo Windows Setup:**
- **Windows CLI**: Lightweight client installed natively on Windows
- **WSL API Service**: Full WorkFlo API running in Windows Subsystem for Linux
- **WSL Web Interface**: Next.js frontend accessible from Windows browsers
- **Automatic Detection**: WSL IP auto-discovery with manual override support

## Quick Installation

### Prerequisites
1. **Windows Subsystem for Linux (WSL)** installed and configured
2. **Administrator privileges** for Windows CLI installation
3. **.NET 9 SDK** installed in WSL
4. **WorkFlo source code** available in WSL

### Step 1: Install Windows CLI

**PowerShell (Recommended):**
```powershell
# Run as Administrator
.\install.ps1
```

**Batch File:**
```cmd
# Run as Administrator
install.bat
```

### Step 2: Set Up WSL API Service

In your **WSL terminal**:
```bash
# Navigate to WorkFlo source directory
cd /path/to/WorkFlo

# Install .NET 9 SDK (if not already installed)
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-9.0

# Start the API service
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj
```

### Step 3: Start Web Interface (Optional)

In another **WSL terminal**:
```bash
cd /path/to/WorkFlo/src/web
npm install
npm run dev:windows
```

### Step 4: Verify Installation

In **Windows PowerShell/Command Prompt**:
```cmd
# Check CLI installation
workflo --version

# Check WSL service status
"C:\Program Files\WorkFlo\wsl-service.ps1" status

# Install git hooks in your repository
cd your-git-repository
workflo install
```

## What Gets Installed on Windows

- **WorkFlo CLI** (`C:\Program Files\WorkFlo\cli\`) - Command-line interface
- **Configuration** (`workflo-config.json`) - WSL API connection settings
- **Service Manager** (`wsl-service.ps1`) - WSL service status and management
- **Desktop Shortcuts** - Quick access to CLI and web interface
- **System PATH** - Global access to `workflo` command

## Installation Details

### Windows Components
```
C:\Program Files\WorkFlo\
├── cli\                    # Windows CLI binaries
├── workflo-config.json     # WSL API configuration
├── wsl-service.ps1         # Service management script
└── uninstall.ps1           # Removal script
```

### WSL Components (User Managed)
```
/path/to/WorkFlo/           # WSL WorkFlo source directory
├── src/WorkFlo.Api/        # API service
├── src/web/                # Web interface
└── ...                     # Full WorkFlo source
```

## Configuration

### Automatic WSL Detection
The installer automatically detects your WSL IP address and configures the CLI to connect to:
- **API Service**: `http://WSL_IP:5000`
- **Web Interface**: `http://WSL_IP:3000`

### Manual Configuration
If automatic detection fails, edit the configuration:
```json
{
  "ApiUrl": "http://YOUR_WSL_IP:5000",
  "WebUrl": "http://YOUR_WSL_IP:3000",
  "WSLIntegration": {
    "Enabled": true,
    "HostIP": "YOUR_WSL_IP",
    "ApiPort": 5000,
    "WebPort": 3000,
    "AutoDetectIP": true
  }
}
```

### Find Your WSL IP
```bash
# In WSL terminal
hostname -I
```

## Service Management

### Check Status
```powershell
# PowerShell
& "C:\Program Files\WorkFlo\wsl-service.ps1" status

# Command Prompt
"C:\Program Files\WorkFlo\wsl-service.ps1" status
```

### Get Start Instructions
```powershell
& "C:\Program Files\WorkFlo\wsl-service.ps1" start
```

## Usage Examples

### Basic Commands
```cmd
# Show help
workflo --help

# Install git hooks in current repository
workflo install

# Validate commit message
workflo validate commit-msg "feat: add new feature"

# Run quality checks
workflo quality check

# Check service status
"C:\Program Files\WorkFlo\wsl-service.ps1" status
```

### Git Hook Integration
After running `workflo install`, the following hooks are active:
- **pre-commit**: Validates code quality and TDD cycles
- **commit-msg**: Enforces conventional commit message format  
- **pre-push**: Runs comprehensive validation before push

All validation is performed by the WSL API service.

## Network Configuration

### Windows Firewall
If you experience connectivity issues:
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "WSL WorkFlo API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "WSL WorkFlo Web" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Test Connectivity
```powershell
# Test API connection
Invoke-WebRequest -Uri "http://YOUR_WSL_IP:5000/health" -Method GET

# Test web interface
Start-Process "http://YOUR_WSL_IP:3000"
```

## Building from Source

### For Developers: Building Windows CLI Releases

**From Windows (PowerShell):**
```powershell
.\scripts\windows\build-release.ps1
```

**From Linux/macOS:**
```bash
./scripts/windows/build-release.sh
```

This creates a Windows CLI distribution in `build/windows/` with:
- Self-contained CLI executable
- Installation scripts
- WSL setup documentation
- Configuration templates

## System Requirements

### Windows Requirements
- **OS**: Windows 10/11 with WSL2 enabled
- **Architecture**: x64 (64-bit)
- **RAM**: 1GB for CLI (additional for WSL)
- **Disk**: 200MB for CLI installation
- **Network**: WSL-Windows network connectivity

### WSL Requirements
- **WSL Version**: WSL2 recommended
- **Linux Distribution**: Ubuntu 20.04+ or compatible
- **.NET SDK**: Version 9.0+
- **Node.js**: Version 18+ (for web interface)
- **RAM**: 2GB minimum for API service

## Troubleshooting

### Common Issues

**1. "workflo command not found"**
- Restart your terminal after installation
- Verify PATH includes `C:\Program Files\WorkFlo\cli`

**2. "WSL API not responding"**
- Check if WSL is running: `wsl --list --running`
- Verify API service is started in WSL
- Check WSL IP connectivity

**3. "Access denied during installation"**
- Run installation script as administrator
- Ensure you have write permissions to Program Files

**4. "WSL IP detection failed"**
- Manually find WSL IP: `wsl hostname -I`
- Update configuration file with correct IP
- Restart WSL if network issues persist

**5. "Firewall blocking connections"**
- Add Windows Firewall rules (see Network Configuration)
- Check corporate/antivirus firewall settings
- Verify WSL networking is enabled

### Log Files
- **CLI Logs**: Console output during command execution
- **API Logs**: WSL terminal output from API service
- **Web Logs**: WSL terminal output from web dev server
- **Installation Logs**: PowerShell/Command Prompt output

## Uninstallation

To remove WorkFlo CLI from Windows:

**PowerShell:**
```powershell
& "C:\Program Files\WorkFlo\uninstall.ps1"
```

**Batch:**
```cmd
"C:\Program Files\WorkFlo\uninstall.bat"
```

This will:
- Remove CLI from system PATH
- Delete desktop shortcuts  
- Remove installation directory
- **Note**: WSL API service is not affected

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `TROUBLESHOOTING.md` for detailed solutions
3. Check WSL service status and logs
4. Verify network connectivity between Windows and WSL

---

**WorkFlo - Enforcing excellence in development workflows**  
*Windows CLI with WSL API Integration*