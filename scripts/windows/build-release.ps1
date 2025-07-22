# WorkFlo Windows Release Builder
# This script builds Windows release binaries and sets up the installation package

param(
    [string]$OutputPath = "build\windows",
    [switch]$SkipTests = $false,
    [switch]$Clean = $false
)

Write-Host "WorkFlo Windows Release Builder" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Check prerequisites
if (-not (Get-Command "dotnet" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: .NET SDK not found. Please install .NET 9 SDK." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js/npm not found. Please install Node.js 18+." -ForegroundColor Red
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

    # Build CLI
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

    # Build API
    Write-Host "Building WorkFlo API for Windows x64..." -ForegroundColor Blue
    dotnet publish src\WorkFlo.Api\WorkFlo.Api.csproj `
        -c Release `
        -r win-x64 `
        --self-contained `
        -o "$OutputPath\api" `
        --verbosity minimal

    if ($LASTEXITCODE -ne 0) {
        throw "API build failed"
    }

    # Build Frontend
    Write-Host "Building WorkFlo Web frontend..." -ForegroundColor Blue
    Push-Location src\web
    try {
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }

        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }

        # Copy frontend build
        Copy-Item .next "$OutputPath\web" -Recurse -Force
    }
    finally {
        Pop-Location
    }

    # Copy installation scripts and documentation
    Write-Host "Copying installation scripts and documentation..." -ForegroundColor Blue
    Copy-Item "scripts\windows\install.ps1" "$OutputPath\" -Force
    Copy-Item "scripts\windows\install.bat" "$OutputPath\" -Force
    Copy-Item "scripts\windows\README.md" "$OutputPath\" -Force
    Copy-Item "scripts\windows\TROUBLESHOOTING.md" "$OutputPath\" -Force

    # Create version info file
    Write-Host "Creating version info..." -ForegroundColor Blue
    $versionInfo = @{
        Version = "0.1.0"
        BuildDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
        Platform = "Windows x64"
        DotNetVersion = (dotnet --version)
        Components = @{
            CLI = "WorkFlo.Cli.exe"
            API = "WorkFlo.Api.exe"
            Web = "Next.js production build"
        }
    } | ConvertTo-Json -Depth 3

    $versionInfo | Out-File -FilePath "$OutputPath\VERSION.json" -Encoding UTF8

    # Calculate sizes
    $cliSize = [math]::Round((Get-ChildItem "$OutputPath\cli" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
    $apiSize = [math]::Round((Get-ChildItem "$OutputPath\api" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
    $webSize = [math]::Round((Get-ChildItem "$OutputPath\web" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
    $totalSize = $cliSize + $apiSize + $webSize

    Write-Host ""
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host "Output Directory: $OutputPath" -ForegroundColor White
    Write-Host "CLI Size: ${cliSize}MB" -ForegroundColor White
    Write-Host "API Size: ${apiSize}MB" -ForegroundColor White
    Write-Host "Web Size: ${webSize}MB" -ForegroundColor White
    Write-Host "Total Size: ${totalSize}MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Installation files:" -ForegroundColor Yellow
    Write-Host "- install.ps1 (PowerShell installer)" -ForegroundColor White
    Write-Host "- install.bat (Batch installer)" -ForegroundColor White
    Write-Host "- README.md (Installation guide)" -ForegroundColor White
    Write-Host "- TROUBLESHOOTING.md (Support guide)" -ForegroundColor White
    Write-Host ""
    Write-Host "To test the build:" -ForegroundColor Yellow
    Write-Host "1. Run: $OutputPath\cli\WorkFlo.Cli.exe --version" -ForegroundColor White
    Write-Host "2. Run: $OutputPath\api\WorkFlo.Api.exe (starts API server)" -ForegroundColor White
    Write-Host ""
    Write-Host "To create installer package:" -ForegroundColor Yellow
    Write-Host ".\scripts\windows\create-installer.ps1 -SourcePath $OutputPath" -ForegroundColor White

} catch {
    Write-Host "Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}