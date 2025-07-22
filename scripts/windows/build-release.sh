#!/bin/bash
# WorkFlo Windows CLI Release Builder (Linux/macOS version)
# This script builds Windows CLI binaries for WSL API integration

set -e

# Default values
OUTPUT_PATH="build/windows"
SKIP_TESTS=false
CLEAN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output-path)
            OUTPUT_PATH="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --help)
            echo "WorkFlo Windows CLI Release Builder (WSL Integration)"
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --output-path PATH    Output directory (default: build/windows)"
            echo "  --skip-tests          Skip running tests"
            echo "  --clean               Clean previous build"
            echo "  --help                Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "WorkFlo Windows CLI Release Builder (WSL Integration)"
echo "===================================================="

# Check prerequisites
if ! command -v dotnet &> /dev/null; then
    echo "Error: .NET SDK not found. Please install .NET 9 SDK."
    exit 1
fi

# Clean previous build if requested
if [ "$CLEAN" = true ] && [ -d "$OUTPUT_PATH" ]; then
    echo "Cleaning previous build..."
    rm -rf "$OUTPUT_PATH"
fi

# Create output directory
echo "Creating output directory: $OUTPUT_PATH"
mkdir -p "$OUTPUT_PATH"

# Run tests unless skipped
if [ "$SKIP_TESTS" = false ]; then
    echo "Running tests..."
    if ! dotnet test --configuration Release --verbosity minimal; then
        echo "Tests failed. Use --skip-tests to build anyway."
        exit 1
    fi
    echo "All tests passed!"
fi

# Build CLI only (API runs in WSL)
echo "Building WorkFlo CLI for Windows x64..."
dotnet publish src/WorkFlo.Cli/WorkFlo.Cli.csproj \
    -c Release \
    -r win-x64 \
    --self-contained \
    -o "$OUTPUT_PATH/cli" \
    --verbosity minimal

# Copy installation scripts and documentation
echo "Copying installation scripts and documentation..."
cp scripts/windows/install.ps1 "$OUTPUT_PATH/"
cp scripts/windows/install.bat "$OUTPUT_PATH/"
cp scripts/windows/README.md "$OUTPUT_PATH/"
cp scripts/windows/TROUBLESHOOTING.md "$OUTPUT_PATH/"

# Create WSL setup guide
echo "Creating WSL setup guide..."
cat > "$OUTPUT_PATH/WSL-SETUP-GUIDE.md" << 'EOF'
# WorkFlo WSL Setup Guide

This Windows CLI build is designed to work with WorkFlo API running in WSL.

## Prerequisites

1. **Windows Subsystem for Linux (WSL)** installed
2. **.NET 9 SDK** installed in WSL
3. **Node.js 18+** installed in WSL (for web interface)
4. **WorkFlo source code** available in WSL

## WSL Setup Steps

### 1. Install WSL Dependencies

In your WSL terminal:
```bash
# Install .NET 9 SDK
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-9.0

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone WorkFlo Repository

```bash
git clone https://github.com/your-org/WorkFlo.git
cd WorkFlo
```

### 3. Start WorkFlo API Service

```bash
# In WSL terminal - API Service
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj

# The API will be available at: http://localhost:5000
# Health check: http://localhost:5000/health
```

### 4. Start Web Interface (Optional)

```bash
# In another WSL terminal - Web Interface
cd src/web
npm install
npm run dev:windows

# The web interface will be available at: http://localhost:3000
# Accessible from Windows browsers via WSL IP
```

### 5. Configure Windows Firewall

If you have connection issues from Windows to WSL:

```powershell
# Run in Windows PowerShell as Administrator
New-NetFirewallRule -DisplayName "WSL WorkFlo API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "WSL WorkFlo Web" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## Windows CLI Usage

After running the Windows installer, the CLI will automatically detect and connect to your WSL API:

```cmd
# Check WSL service status
"C:\Program Files\WorkFlo\wsl-service.ps1" status

# Use WorkFlo CLI commands (connects to WSL API)
workflo --help
workflo install    # Setup git hooks in current repository
workflo validate   # Validate using WSL API
```

## Troubleshooting

### WSL IP Detection
If the installer cannot detect your WSL IP automatically, manually find it:

```bash
# In WSL
hostname -I
```

Then update the configuration file:
```
C:\Program Files\WorkFlo\workflo-config.json
```

### Network Connectivity
Test connectivity from Windows:

```powershell
# Test API connectivity
Invoke-WebRequest -Uri "http://YOUR_WSL_IP:5000/health" -Method GET

# Test web interface
Invoke-WebRequest -Uri "http://YOUR_WSL_IP:3000" -Method GET
```

### Service Management
Use the included service management script:

```cmd
# Check status
"C:\Program Files\WorkFlo\wsl-service.ps1" status

# Get start instructions
"C:\Program Files\WorkFlo\wsl-service.ps1" start
```

## Architecture

- **Windows CLI**: Lightweight client that sends commands to WSL API
- **WSL API**: Full WorkFlo API service running in Linux environment
- **WSL Web**: Next.js web interface accessible from Windows browsers
- **Configuration**: Automatic WSL IP detection with manual override capability

This setup provides the best of both worlds: native Windows CLI experience with full Linux API functionality.
EOF

# Create version info file
echo "Creating version info..."
cat > "$OUTPUT_PATH/VERSION.json" << EOF
{
  "Version": "0.1.0",
  "BuildDate": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
  "Platform": "Windows x64 (WSL Integration)",
  "DotNetVersion": "$(dotnet --version)",
  "Architecture": "CLI-only build for WSL API connectivity",
  "Components": {
    "CLI": "WorkFlo.Cli.exe",
    "API": "Runs in WSL",
    "Web": "Accessible via WSL IP"
  }
}
EOF

# Calculate sizes
CLI_SIZE=$(du -sm "$OUTPUT_PATH/cli" | cut -f1)

echo ""
echo "Build completed successfully!"
echo "============================"
echo "Output Directory: $OUTPUT_PATH"
echo "CLI Size: ${CLI_SIZE}MB"
echo "Architecture: CLI-only build for WSL integration"
echo ""
echo "Installation files:"
echo "- install.ps1 (PowerShell installer)"
echo "- install.bat (Batch installer)"
echo "- README.md (Installation guide)"
echo "- TROUBLESHOOTING.md (Support guide)"
echo "- WSL-SETUP-GUIDE.md (WSL configuration guide)"
echo ""
echo "To test the build:"
echo "1. Run: $OUTPUT_PATH/cli/WorkFlo.Cli.exe --version (on Windows)"
echo "2. Set up WSL API service (see WSL-SETUP-GUIDE.md)"
echo ""
echo "WSL Requirements:"
echo "- WSL with .NET 9 SDK installed"
echo "- WorkFlo API running: dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj"
echo "- Network connectivity between Windows and WSL"