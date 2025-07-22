# WorkFlo Windows CLI Release Builder
# This script builds Windows CLI binaries for WSL API integration

param(
    [string]$OutputPath = "build\windows",
    [switch]$SkipTests = $false,
    [switch]$Clean = $false
)

Write-Host "WorkFlo Windows CLI Release Builder (WSL Integration)" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

# Check prerequisites
if (-not (Get-Command "dotnet" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: .NET SDK not found. Please install .NET 9 SDK." -ForegroundColor Red
    exit 1
}

# Clean previous build if requested
if ($Clean -and (Test-Path $OutputPath)) {
    Write-Host "Cleaning previous build..." -ForegroundColor Blue
    Remove-Item $OutputPath -Recurse -Force
}

# Create output directory
Write-Host "Creating output directory: $OutputPath" -ForegroundColor Blue
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

try {
    # Run tests unless skipped
    if (-not $SkipTests) {
        Write-Host "Running tests..." -ForegroundColor Blue
        $testResult = dotnet test --configuration Release --verbosity minimal
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Tests failed. Use -SkipTests to build anyway." -ForegroundColor Red
            exit 1
        }
        Write-Host "All tests passed!" -ForegroundColor Green
    }

    # Build CLI only (API runs in WSL)
    Write-Host "Building WorkFlo CLI for Windows x64..." -ForegroundColor Blue
    dotnet publish src\WorkFlo.Cli\WorkFlo.Cli.csproj `
        -c Release `
        -r win-x64 `
        --self-contained `
        -o "$OutputPath\cli" `
        --verbosity minimal

    if ($LASTEXITCODE -ne 0) {
        throw "CLI build failed"
    }

    # Copy installation scripts and documentation
    Write-Host "Copying installation scripts and documentation..." -ForegroundColor Blue
    Copy-Item "scripts\windows\install.ps1" "$OutputPath\" -Force
    Copy-Item "scripts\windows\install.bat" "$OutputPath\" -Force
    Copy-Item "scripts\windows\README.md" "$OutputPath\" -Force
    Copy-Item "scripts\windows\TROUBLESHOOTING.md" "$OutputPath\" -Force

    # Create WSL setup guide
    Write-Host "Creating WSL setup guide..." -ForegroundColor Blue
    $wslGuide = @"
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
``````bash
# Install .NET 9 SDK
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-9.0

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
``````

### 2. Clone WorkFlo Repository

``````bash
git clone https://github.com/your-org/WorkFlo.git
cd WorkFlo
``````

### 3. Start WorkFlo API Service

``````bash
# In WSL terminal - API Service
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj

# The API will be available at: http://localhost:5000
# Health check: http://localhost:5000/health
``````

### 4. Start Web Interface (Optional)

``````bash
# In another WSL terminal - Web Interface
cd src/web
npm install
npm run dev:windows

# The web interface will be available at: http://localhost:3000
# Accessible from Windows browsers via WSL IP
``````

### 5. Configure Windows Firewall

If you have connection issues from Windows to WSL:

``````powershell
# Run in Windows PowerShell as Administrator
New-NetFirewallRule -DisplayName "WSL WorkFlo API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "WSL WorkFlo Web" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
``````

## Windows CLI Usage

After running the Windows installer, the CLI will automatically detect and connect to your WSL API:

``````cmd
# Check WSL service status
"C:\Program Files\WorkFlo\wsl-service.ps1" status

# Use WorkFlo CLI commands (connects to WSL API)
workflo --help
workflo install    # Setup git hooks in current repository
workflo validate   # Validate using WSL API
``````

## Troubleshooting

### WSL IP Detection
If the installer cannot detect your WSL IP automatically, manually find it:

``````bash
# In WSL
hostname -I
``````

Then update the configuration file:
``````
C:\Program Files\WorkFlo\workflo-config.json
``````

### Network Connectivity
Test connectivity from Windows:

``````powershell
# Test API connectivity
Invoke-WebRequest -Uri "http://YOUR_WSL_IP:5000/health" -Method GET

# Test web interface
Invoke-WebRequest -Uri "http://YOUR_WSL_IP:3000" -Method GET
``````

### Service Management
Use the included service management script:

``````cmd
# Check status
"C:\Program Files\WorkFlo\wsl-service.ps1" status

# Get start instructions
"C:\Program Files\WorkFlo\wsl-service.ps1" start
``````

## Architecture

- **Windows CLI**: Lightweight client that sends commands to WSL API
- **WSL API**: Full WorkFlo API service running in Linux environment
- **WSL Web**: Next.js web interface accessible from Windows browsers
- **Configuration**: Automatic WSL IP detection with manual override capability

This setup provides the best of both worlds: native Windows CLI experience with full Linux API functionality.
"@
    $wslGuide | Out-File -FilePath "$OutputPath\WSL-SETUP-GUIDE.md" -Encoding UTF8

    # Create version info file
    Write-Host "Creating version info..." -ForegroundColor Blue
    $versionInfo = @{
        Version = "0.1.0"
        BuildDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
        Platform = "Windows x64 (WSL Integration)"
        DotNetVersion = (dotnet --version)
        Architecture = "CLI-only build for WSL API connectivity"
        Components = @{
            CLI = "WorkFlo.Cli.exe"
            API = "Runs in WSL"
            Web = "Accessible via WSL IP"
        }
    } | ConvertTo-Json -Depth 3

    $versionInfo | Out-File -FilePath "$OutputPath\VERSION.json" -Encoding UTF8

    # Calculate sizes
    $cliSize = [math]::Round((Get-ChildItem "$OutputPath\cli" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)

    Write-Host ""
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host "Output Directory: $OutputPath" -ForegroundColor White
    Write-Host "CLI Size: ${cliSize}MB" -ForegroundColor White
    Write-Host "Architecture: CLI-only build for WSL integration" -ForegroundColor White
    Write-Host ""
    Write-Host "Installation files:" -ForegroundColor Yellow
    Write-Host "- install.ps1 (PowerShell installer)" -ForegroundColor White
    Write-Host "- install.bat (Batch installer)" -ForegroundColor White
    Write-Host "- README.md (Installation guide)" -ForegroundColor White
    Write-Host "- TROUBLESHOOTING.md (Support guide)" -ForegroundColor White
    Write-Host "- WSL-SETUP-GUIDE.md (WSL configuration guide)" -ForegroundColor White
    Write-Host ""
    Write-Host "To test the build:" -ForegroundColor Yellow
    Write-Host "1. Run: $OutputPath\cli\WorkFlo.Cli.exe --version" -ForegroundColor White
    Write-Host "2. Set up WSL API service (see WSL-SETUP-GUIDE.md)" -ForegroundColor White
    Write-Host ""
    Write-Host "WSL Requirements:" -ForegroundColor Cyan
    Write-Host "- WSL with .NET 9 SDK installed" -ForegroundColor White
    Write-Host "- WorkFlo API running: dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj" -ForegroundColor White
    Write-Host "- Network connectivity between Windows and WSL" -ForegroundColor White

} catch {
    Write-Host "Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}