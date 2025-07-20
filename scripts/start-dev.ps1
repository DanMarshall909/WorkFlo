# WorkFlo Development Server Startup Script (PowerShell)
# This script starts both the API server and web application in development mode

param(
    [int]$ApiPort = 5016,
    [int]$WebPort = 3002,
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host @"
WorkFlo Development Server Startup Script

Usage: .\scripts\start-dev.ps1 [OPTIONS]

Options:
    -ApiPort <port>    Port for API server (default: 5016)
    -WebPort <port>    Port for web application (default: 3002)
    -Help              Show this help message

Examples:
    .\scripts\start-dev.ps1
    .\scripts\start-dev.ps1 -ApiPort 5020 -WebPort 3010
"@
    exit 0
}

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $false  # Port is free
    }
    catch {
        return $true   # Port is in use
    }
}

# Function to find next available port
function Find-AvailablePort {
    param([int]$BasePort)
    
    $port = $BasePort
    while (Test-Port -Port $port) {
        $port++
    }
    return $port
}

# Function to cleanup background processes
function Stop-Services {
    Write-Status "Shutting down services..."
    
    if ($script:ApiProcess -and !$script:ApiProcess.HasExited) {
        $script:ApiProcess.Kill()
        Write-Status "API server stopped"
    }
    
    if ($script:WebProcess -and !$script:WebProcess.HasExited) {
        $script:WebProcess.Kill()
        Write-Status "Web server stopped"
    }
    
    # Stop Seq container if it was started by this script
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $existingSeq = docker ps --filter "name=workflo-seq" --format "table {{.Names}}" 2>$null
        if ($existingSeq -and $existingSeq -match "workflo-seq") {
            Write-Status "Stopping Seq logging container..."
            docker stop workflo-seq 2>$null
        }
    }
    
    exit 0
}

# Set up Ctrl+C handler
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName CancelKeyPress -Action {
    Stop-Services
}

Write-Status "Starting WorkFlo Development Environment..."

# Get the script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Start Seq logging container if Docker is available
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Status "Starting Seq logging container..."
    
    # Check if Seq container is already running
    $existingSeq = docker ps --filter "name=workflo-seq" --format "table {{.Names}}" 2>$null
    if (-not $existingSeq -or $existingSeq -notmatch "workflo-seq") {
        try {
            $null = docker run -d `
                --name workflo-seq `
                --rm `
                -e ACCEPT_EULA=Y `
                -e SEQ_FIRSTRUN_ADMINPASSWORD=admin123! `
                -p 5341:5341 `
                -p 8080:80 `
                datalust/seq:latest 2>$null
            
            Write-Success "Seq logging container started"
            Write-Status "Seq web interface: http://localhost:8080 (admin/admin123!)"
            $script:SeqStarted = $true
        }
        catch {
            Write-Warning "Failed to start Seq container, continuing without centralized logging"
            $script:SeqStarted = $false
        }
    }
    else {
        Write-Status "Seq container already running"
        $script:SeqStarted = $true
    }
}
else {
    Write-Warning "Docker not available, skipping Seq logging container"
    $script:SeqStarted = $false
}

# Check if we're in the right directory
if (!(Test-Path "$ProjectRoot\WorkFlo.sln")) {
    Write-Error "Could not find WorkFlo.sln. Make sure you're running this script from the project root or scripts directory."
    exit 1
}

# Find available ports
$FinalApiPort = Find-AvailablePort -BasePort $ApiPort
$FinalWebPort = Find-AvailablePort -BasePort $WebPort

if ($FinalApiPort -ne $ApiPort) {
    Write-Warning "Port $ApiPort is in use, using port $FinalApiPort for API"
}

if ($FinalWebPort -ne $WebPort) {
    Write-Warning "Port $WebPort is in use, using port $FinalWebPort for web app"
}

# Start API server
Write-Status "Starting API server on port $FinalApiPort..."
$ApiPath = Join-Path $ProjectRoot "src\WorkFlo.Api"

if (!(Test-Path "$ApiPath\WorkFlo.Api.csproj")) {
    Write-Error "Could not find WorkFlo.Api.csproj in src\WorkFlo.Api\"
    exit 1
}

try {
    Set-Location $ApiPath
    $script:ApiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run", "--urls", "http://localhost:$FinalApiPort" -PassThru -NoNewWindow
    
    # Wait a moment for API to start
    Start-Sleep -Seconds 3
    
    if ($script:ApiProcess.HasExited) {
        Write-Error "Failed to start API server. Check the console for details."
        exit 1
    }
    
    Write-Success "API server started on http://localhost:$FinalApiPort"
    Write-Status "Swagger UI available at http://localhost:$FinalApiPort/swagger"
}
catch {
    Write-Error "Failed to start API server: $($_.Exception.Message)"
    exit 1
}

# Start web application
Write-Status "Starting web application on port $FinalWebPort..."
$WebPath = Join-Path $ProjectRoot "src\web"

if (!(Test-Path "$WebPath\package.json")) {
    Write-Error "Could not find package.json in src\web\"
    Stop-Services
    exit 1
}

try {
    Set-Location $WebPath
    
    # Install dependencies if node_modules doesn't exist
    if (!(Test-Path "node_modules")) {
        Write-Status "Installing web dependencies..."
        npm install
    }
    
    # Set the port for Next.js
    $env:PORT = $FinalWebPort
    
    $script:WebProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow
    
    # Wait a moment for web app to start
    Start-Sleep -Seconds 5
    
    if ($script:WebProcess.HasExited) {
        Write-Error "Failed to start web application. Check the console for details."
        Stop-Services
        exit 1
    }
    
    Write-Success "Web application started on http://localhost:$FinalWebPort"
}
catch {
    Write-Error "Failed to start web application: $($_.Exception.Message)"
    Stop-Services
    exit 1
}

# Display summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚀 WorkFlo Development Environment Ready" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Web Application: http://localhost:$FinalWebPort" -ForegroundColor White
Write-Host "🔧 API Server:      http://localhost:$FinalApiPort" -ForegroundColor White
Write-Host "📚 Swagger UI:      http://localhost:$FinalApiPort/swagger" -ForegroundColor White
if ($script:SeqStarted) {
    Write-Host "📊 Seq Logging:     http://localhost:8080 (admin/admin123!)" -ForegroundColor White
}
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan

# Wait for user interrupt
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if processes are still running
        if ($script:ApiProcess.HasExited) {
            Write-Error "API server has stopped unexpectedly"
            Stop-Services
        }
        
        if ($script:WebProcess.HasExited) {
            Write-Error "Web application has stopped unexpectedly"
            Stop-Services
        }
    }
}
catch {
    Stop-Services
}