# WorkFlo Windows CLI Installation Script
# This script installs WorkFlo CLI on Windows systems to connect to WSL API

param(
    [string]$InstallPath = "$env:ProgramFiles\WorkFlo",
    [switch]$AddToPath = $true,
    [switch]$CreateShortcuts = $true,
    [switch]$Force = $false
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

Write-Host "WorkFlo CLI Installation Script (WSL Integration)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Function to detect WSL IP address
function Get-WSLHostIP {
    try {
        # Try to get WSL IP from Windows hosts file or network adapters
        $wslAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*WSL*" -or $_.InterfaceDescription -like "*WSL*" }
        if ($wslAdapter) {
            $wslIP = (Get-NetIPAddress -InterfaceIndex $wslAdapter.InterfaceIndex -AddressFamily IPv4).IPAddress
            if ($wslIP) {
                return $wslIP
            }
        }
        
        # Alternative: Parse WSL from route table
        $routes = Get-NetRoute -DestinationPrefix "172.16.0.0/12" -ErrorAction SilentlyContinue
        if ($routes) {
            return $routes[0].NextHop
        }
        
        # Default WSL range
        return "172.20.208.1"
    }
    catch {
        Write-Host "Could not detect WSL IP automatically. Using default: 172.20.208.1" -ForegroundColor Yellow
        return "172.20.208.1"
    }
}

# Check if WorkFlo is already installed
if (Test-Path $InstallPath -and -not $Force) {
    Write-Host "WorkFlo appears to be already installed at $InstallPath" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite the existing installation? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

try {
    # Create installation directory
    Write-Host "Creating installation directory at $InstallPath..." -ForegroundColor Blue
    if (Test-Path $InstallPath) {
        Remove-Item $InstallPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

    # Copy CLI binaries only (API runs in WSL)
    Write-Host "Installing WorkFlo CLI..." -ForegroundColor Blue
    $cliPath = Join-Path $InstallPath "cli"
    New-Item -ItemType Directory -Path $cliPath -Force | Out-Null
    Copy-Item "cli\*" $cliPath -Recurse -Force

    # Detect WSL IP for API connectivity
    Write-Host "Detecting WSL network configuration..." -ForegroundColor Blue
    $wslIP = Get-WSLHostIP
    Write-Host "WSL Host IP detected: $wslIP" -ForegroundColor Green

    # Add to PATH if requested
    if ($AddToPath) {
        Write-Host "Adding WorkFlo CLI to system PATH..." -ForegroundColor Blue
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$cliPath*") {
            $newPath = $currentPath + ";" + $cliPath
            [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
            Write-Host "Added $cliPath to system PATH. Please restart your terminal." -ForegroundColor Green
        } else {
            Write-Host "WorkFlo CLI path already exists in system PATH." -ForegroundColor Yellow
        }
    }

    # Create shortcuts if requested
    if ($CreateShortcuts) {
        Write-Host "Creating desktop shortcuts..." -ForegroundColor Blue
        
        # Create CLI shortcut
        $WshShell = New-Object -comObject WScript.Shell
        $cliShortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\WorkFlo CLI.lnk")
        $cliShortcut.TargetPath = "cmd.exe"
        $cliShortcut.Arguments = "/k `"cd /d $cliPath && workflo.exe --help`""
        $cliShortcut.WorkingDirectory = $cliPath
        $cliShortcut.Description = "WorkFlo Command Line Interface"
        $cliShortcut.Save()

        # Create Web Interface shortcut (points to WSL)
        $webShortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\WorkFlo Web.lnk")
        $webShortcut.TargetPath = "http://${wslIP}:3000"
        $webShortcut.Description = "WorkFlo Web Interface (WSL)"
        $webShortcut.Save()
    }

    # Create WSL API configuration
    Write-Host "Creating WSL API configuration..." -ForegroundColor Blue
    $configContent = @"
{
  "ApiUrl": "http://${wslIP}:5000",
  "WebUrl": "http://${wslIP}:3000",
  "WSLIntegration": {
    "Enabled": true,
    "HostIP": "${wslIP}",
    "ApiPort": 5000,
    "WebPort": 3000,
    "AutoDetectIP": true
  },
  "DefaultSettings": {
    "EnableLogging": true,
    "LogLevel": "Information"
  }
}
"@
    $configContent | Out-File -FilePath (Join-Path $InstallPath "workflo-config.json") -Encoding UTF8

    # Create WSL service check script
    Write-Host "Creating WSL service management script..." -ForegroundColor Blue
    $serviceScript = @"
# WorkFlo WSL Service Management
# This script helps check and manage the WorkFlo API service running in WSL

param(
    [ValidateSet("status", "start", "stop", "restart")]
    [string]`$Action = "status"
)

`$wslIP = "$wslIP"
`$apiUrl = "http://`${wslIP}:5000"
`$webUrl = "http://`${wslIP}:3000"

function Test-WSLService {
    param(`$Url, `$ServiceName)
    try {
        `$response = Invoke-WebRequest -Uri "`$Url/health" -Method GET -TimeoutSec 5 -UseBasicParsing
        if (`$response.StatusCode -eq 200) {
            Write-Host "`$ServiceName is running at `$Url" -ForegroundColor Green
            return `$true
        }
    }
    catch {
        Write-Host "`$ServiceName is not responding at `$Url" -ForegroundColor Red
        return `$false
    }
}

function Show-WSLInstructions {
    Write-Host ""
    Write-Host "To start WorkFlo API in WSL:" -ForegroundColor Yellow
    Write-Host "1. Open WSL terminal" -ForegroundColor White
    Write-Host "2. Navigate to WorkFlo directory" -ForegroundColor White
    Write-Host "3. Run: dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj" -ForegroundColor White
    Write-Host ""
    Write-Host "For web interface:" -ForegroundColor Yellow
    Write-Host "1. In WSL, navigate to src/web/" -ForegroundColor White
    Write-Host "2. Run: npm run dev:windows" -ForegroundColor White
    Write-Host "3. Access from Windows: `$webUrl" -ForegroundColor White
}

switch (`$Action) {
    "status" {
        Write-Host "WorkFlo WSL Service Status" -ForegroundColor Blue
        Write-Host "=========================" -ForegroundColor Blue
        `$apiRunning = Test-WSLService `$apiUrl "API Service"
        `$webRunning = Test-WSLService `$webUrl "Web Service"
        
        if (-not `$apiRunning -or -not `$webRunning) {
            Show-WSLInstructions
        }
    }
    "start" {
        Write-Host "Starting WorkFlo services in WSL..." -ForegroundColor Blue
        Show-WSLInstructions
    }
    "stop" {
        Write-Host "To stop WorkFlo services, use Ctrl+C in the WSL terminals where they're running." -ForegroundColor Yellow
    }
    "restart" {
        Write-Host "To restart WorkFlo services:" -ForegroundColor Yellow
        Write-Host "1. Use Ctrl+C to stop services in WSL terminals" -ForegroundColor White
        Write-Host "2. Restart using the start instructions" -ForegroundColor White
        Show-WSLInstructions
    }
}
"@
    $serviceScript | Out-File -FilePath (Join-Path $InstallPath "wsl-service.ps1") -Encoding UTF8

    # Create uninstall script
    Write-Host "Creating uninstall script..." -ForegroundColor Blue
    $uninstallScript = @"
# WorkFlo Uninstall Script
# This script removes WorkFlo CLI from your system

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

Write-Host "WorkFlo Uninstall Script" -ForegroundColor Red
Write-Host "=======================" -ForegroundColor Red

# Remove from PATH
Write-Host "Removing from system PATH..." -ForegroundColor Blue
`$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
`$newPath = `$currentPath -replace [regex]::Escape("$cliPath") + ";?", ""
`$newPath = `$newPath -replace ";`$", ""
[Environment]::SetEnvironmentVariable("PATH", `$newPath, "Machine")

# Remove desktop shortcuts
Write-Host "Removing desktop shortcuts..." -ForegroundColor Blue
Remove-Item "`$env:USERPROFILE\Desktop\WorkFlo CLI.lnk" -ErrorAction SilentlyContinue
Remove-Item "`$env:USERPROFILE\Desktop\WorkFlo Web.lnk" -ErrorAction SilentlyContinue

# Remove installation directory
Write-Host "Removing installation directory..." -ForegroundColor Blue
Remove-Item "$InstallPath" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "WorkFlo CLI has been uninstalled successfully." -ForegroundColor Green
Write-Host "Note: WorkFlo API service in WSL was not affected." -ForegroundColor Yellow
Write-Host "Please restart your terminal to update PATH changes." -ForegroundColor Yellow
"@
    $uninstallScript | Out-File -FilePath (Join-Path $InstallPath "uninstall.ps1") -Encoding UTF8

    Write-Host ""
    Write-Host "Installation completed successfully!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "Installation Path: $InstallPath" -ForegroundColor White
    Write-Host "CLI Executable: $cliPath\WorkFlo.Cli.exe" -ForegroundColor White
    Write-Host "WSL API URL: http://${wslIP}:5000" -ForegroundColor White
    Write-Host "WSL Web URL: http://${wslIP}:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your terminal to use 'workflo' command globally" -ForegroundColor White
    Write-Host "2. Set up WorkFlo API service in WSL (see instructions below)" -ForegroundColor White
    Write-Host "3. Run '$InstallPath\wsl-service.ps1 status' to check WSL services" -ForegroundColor White
    Write-Host "4. Navigate to your git repository and run 'workflo install' to setup git hooks" -ForegroundColor White
    Write-Host ""
    Write-Host "WSL Setup Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open WSL terminal" -ForegroundColor White
    Write-Host "2. Navigate to WorkFlo source directory" -ForegroundColor White
    Write-Host "3. Run: dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj" -ForegroundColor White
    Write-Host "4. For web interface: cd src/web && npm run dev:windows" -ForegroundColor White
    Write-Host ""
    Write-Host "To uninstall: $InstallPath\uninstall.ps1" -ForegroundColor Gray

} catch {
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}