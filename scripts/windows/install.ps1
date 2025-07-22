# WorkFlo Windows Installation Script
# This script installs WorkFlo CLI and API on Windows systems

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

Write-Host "WorkFlo Installation Script" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

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

    # Copy CLI binaries
    Write-Host "Installing WorkFlo CLI..." -ForegroundColor Blue
    $cliPath = Join-Path $InstallPath "cli"
    New-Item -ItemType Directory -Path $cliPath -Force | Out-Null
    Copy-Item "cli\*" $cliPath -Recurse -Force

    # Copy API binaries
    Write-Host "Installing WorkFlo API..." -ForegroundColor Blue
    $apiPath = Join-Path $InstallPath "api"
    New-Item -ItemType Directory -Path $apiPath -Force | Out-Null
    Copy-Item "api\*" $apiPath -Recurse -Force

    # Copy Web frontend
    Write-Host "Installing WorkFlo Web frontend..." -ForegroundColor Blue
    $webPath = Join-Path $InstallPath "web"
    New-Item -ItemType Directory -Path $webPath -Force | Out-Null
    Copy-Item "web\*" $webPath -Recurse -Force

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

        # Create API shortcut
        $apiShortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\WorkFlo API Server.lnk")
        $apiShortcut.TargetPath = Join-Path $apiPath "WorkFlo.Api.exe"
        $apiShortcut.WorkingDirectory = $apiPath
        $apiShortcut.Description = "WorkFlo API Server"
        $apiShortcut.Save()
    }

    # Create service installation script
    Write-Host "Creating service installation script..." -ForegroundColor Blue
    $serviceScript = @"
# WorkFlo API Service Installation
# Run this script as administrator to install WorkFlo API as a Windows service

`$serviceName = "WorkFloAPI"
`$serviceDisplayName = "WorkFlo API Service"
`$serviceDescription = "WorkFlo AI-powered workflow enforcement API server"
`$servicePath = "$apiPath\WorkFlo.Api.exe"

# Check if service already exists
if (Get-Service `$serviceName -ErrorAction SilentlyContinue) {
    Write-Host "Service `$serviceName already exists. Stopping and removing..." -ForegroundColor Yellow
    Stop-Service `$serviceName -Force
    Remove-Service `$serviceName
}

# Install service using sc.exe
Write-Host "Installing WorkFlo API as Windows service..." -ForegroundColor Blue
`$result = sc.exe create `$serviceName binPath= `$servicePath DisplayName= `$serviceDisplayName start= auto
if (`$LASTEXITCODE -eq 0) {
    sc.exe description `$serviceName `$serviceDescription
    Write-Host "Service installed successfully. Starting service..." -ForegroundColor Green
    Start-Service `$serviceName
    Write-Host "WorkFlo API service is now running." -ForegroundColor Green
} else {
    Write-Host "Failed to install service. Error code: `$LASTEXITCODE" -ForegroundColor Red
}
"@
    $serviceScript | Out-File -FilePath (Join-Path $InstallPath "install-service.ps1") -Encoding UTF8

    # Create uninstall script
    Write-Host "Creating uninstall script..." -ForegroundColor Blue
    $uninstallScript = @"
# WorkFlo Uninstall Script
# This script removes WorkFlo from your system

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

Write-Host "WorkFlo Uninstall Script" -ForegroundColor Red
Write-Host "=======================" -ForegroundColor Red

# Stop and remove service if it exists
if (Get-Service "WorkFloAPI" -ErrorAction SilentlyContinue) {
    Write-Host "Stopping and removing WorkFlo API service..." -ForegroundColor Blue
    Stop-Service "WorkFloAPI" -Force
    Remove-Service "WorkFloAPI"
}

# Remove from PATH
Write-Host "Removing from system PATH..." -ForegroundColor Blue
`$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
`$newPath = `$currentPath -replace [regex]::Escape("$cliPath") + ";?", ""
`$newPath = `$newPath -replace ";`$", ""
[Environment]::SetEnvironmentVariable("PATH", `$newPath, "Machine")

# Remove desktop shortcuts
Write-Host "Removing desktop shortcuts..." -ForegroundColor Blue
Remove-Item "`$env:USERPROFILE\Desktop\WorkFlo CLI.lnk" -ErrorAction SilentlyContinue
Remove-Item "`$env:USERPROFILE\Desktop\WorkFlo API Server.lnk" -ErrorAction SilentlyContinue

# Remove installation directory
Write-Host "Removing installation directory..." -ForegroundColor Blue
Remove-Item "$InstallPath" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "WorkFlo has been uninstalled successfully." -ForegroundColor Green
Write-Host "Please restart your terminal to update PATH changes." -ForegroundColor Yellow
"@
    $uninstallScript | Out-File -FilePath (Join-Path $InstallPath "uninstall.ps1") -Encoding UTF8

    # Create configuration file
    Write-Host "Creating default configuration..." -ForegroundColor Blue
    $configContent = @"
{
  "ApiUrl": "http://localhost:5016",
  "WebUrl": "http://localhost:3000",
  "DefaultSettings": {
    "AutoStartApi": true,
    "EnableLogging": true,
    "LogLevel": "Information"
  }
}
"@
    $configContent | Out-File -FilePath (Join-Path $InstallPath "workflo-config.json") -Encoding UTF8

    Write-Host ""
    Write-Host "Installation completed successfully!" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host "Installation Path: $InstallPath" -ForegroundColor White
    Write-Host "CLI Executable: $cliPath\WorkFlo.Cli.exe" -ForegroundColor White
    Write-Host "API Executable: $apiPath\WorkFlo.Api.exe" -ForegroundColor White
    Write-Host "Web Frontend: $webPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your terminal to use 'workflo' command globally" -ForegroundColor White
    Write-Host "2. Run 'workflo --help' to see available commands" -ForegroundColor White
    Write-Host "3. Run '$InstallPath\install-service.ps1' to install API as Windows service" -ForegroundColor White
    Write-Host "4. Navigate to your git repository and run 'workflo install' to setup git hooks" -ForegroundColor White
    Write-Host ""
    Write-Host "To uninstall, run: $InstallPath\uninstall.ps1" -ForegroundColor Gray

} catch {
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}