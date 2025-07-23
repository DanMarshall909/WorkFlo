#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Comprehensive PR Quality Check Script for WorkFlo Project
.DESCRIPTION
    Runs all quality checks required before submitting a PR including:
    - ReSharper code analysis
    - .NET analyzers
    - Code formatting
    - Unit tests with coverage
    - Build verification
    - Security scans
.PARAMETER SkipTests
    Skip running unit tests (for quick checks)
.PARAMETER SkipCoverage
    Skip code coverage analysis
.PARAMETER OutputPath
    Path to save the quality report (default: ./reports/pr-quality-report.html)
.EXAMPLE
    ./scripts/pr-quality-check.ps1
.EXAMPLE
    ./scripts/pr-quality-check.ps1 -SkipTests -OutputPath "./my-report.html"
#>

param(
    [switch]$SkipTests,
    [switch]$SkipCoverage,
    [string]$OutputPath = "./reports/pr-quality-report.html"
)

# Script configuration
$ErrorActionPreference = "Stop"
$startTime = Get-Date
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$reportsDir = Join-Path $rootDir "reports"

# Ensure reports directory exists
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
}

# Color functions for better output
function Write-Success($message) { Write-Host "✅ $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "⚠️  $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "❌ $message" -ForegroundColor Red }
function Write-Info($message) { Write-Host "ℹ️  $message" -ForegroundColor Cyan }
function Write-Header($message) { 
    Write-Host ""
    Write-Host "🔄 $message" -ForegroundColor Blue
    Write-Host ("=" * 80) -ForegroundColor Blue
}

# Quality check results
$results = @{
    Timestamp = $startTime
    Checks = @()
    OverallStatus = "PENDING"
    Duration = $null
    Summary = @{
        Passed = 0
        Failed = 0
        Warnings = 0
        Skipped = 0
    }
}

function Add-CheckResult($name, $status, $details, $outputFile = $null) {
    $result = @{
        Name = $name
        Status = $status
        Details = $details
        OutputFile = $outputFile
        Timestamp = Get-Date
    }
    $results.Checks += $result
    
    switch ($status) {
        "PASS" { 
            $results.Summary.Passed++
            Write-Success "$name - PASSED"
        }
        "FAIL" { 
            $results.Summary.Failed++
            Write-Error "$name - FAILED: $details"
        }
        "WARN" { 
            $results.Summary.Warnings++
            Write-Warning "$name - WARNING: $details"
        }
        "SKIP" { 
            $results.Summary.Skipped++
            Write-Info "$name - SKIPPED: $details"
        }
    }
}

function Test-Command($command) {
    try {
        & $command --version 2>&1 | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

Write-Header "🚀 Starting PR Quality Check for WorkFlo Project"
Write-Info "Report will be saved to: $OutputPath"
Write-Info "Started at: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))"

try {
    Set-Location $rootDir

    # 1. Verify Required Tools
    Write-Header "🔧 Verifying Required Tools"
    
    $requiredTools = @(
        @{ Name = "dotnet"; Command = "dotnet"; Description = ".NET SDK" },
        @{ Name = "jb"; Command = "jb"; Description = "ReSharper Command Line Tools" }
    )
    
    foreach ($tool in $requiredTools) {
        if (Test-Command $tool.Command) {
            Add-CheckResult "Tool: $($tool.Description)" "PASS" "Available and working"
        } else {
            Add-CheckResult "Tool: $($tool.Description)" "FAIL" "Not found or not working. Please install $($tool.Name)"
        }
    }

    # 2. Clean and Restore
    Write-Header "🧹 Clean and Restore"
    
    try {
        dotnet clean --verbosity quiet
        Add-CheckResult "Clean Solution" "PASS" "Solution cleaned successfully"
    }
    catch {
        Add-CheckResult "Clean Solution" "FAIL" "Failed to clean solution: $($_.Exception.Message)"
    }
    
    try {
        dotnet restore --verbosity quiet
        Add-CheckResult "Restore Packages" "PASS" "Packages restored successfully"
    }
    catch {
        Add-CheckResult "Restore Packages" "FAIL" "Failed to restore packages: $($_.Exception.Message)"
    }

    # 3. Build Solution
    Write-Header "🔨 Build Verification"
    
    try {
        $buildOutput = dotnet build --no-restore --verbosity minimal 2>&1
        if ($LASTEXITCODE -eq 0) {
            $warningCount = ($buildOutput | Select-String "warning").Count
            if ($warningCount -gt 0) {
                Add-CheckResult "Build Solution" "WARN" "$warningCount build warnings found"
            } else {
                Add-CheckResult "Build Solution" "PASS" "Build completed without warnings"
            }
        } else {
            Add-CheckResult "Build Solution" "FAIL" "Build failed. Check build output for details."
        }
    }
    catch {
        Add-CheckResult "Build Solution" "FAIL" "Build process failed: $($_.Exception.Message)"
    }

    # 4. Code Formatting Check
    Write-Header "🎨 Code Formatting"
    
    try {
        $formatOutput = dotnet format --verify-no-changes --verbosity diagnostic 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-CheckResult "Code Formatting" "PASS" "All files are properly formatted"
        } else {
            Add-CheckResult "Code Formatting" "FAIL" "Code formatting issues found. Run 'dotnet format' to fix."
        }
    }
    catch {
        Add-CheckResult "Code Formatting" "WARN" "Could not verify formatting: $($_.Exception.Message)"
    }

    # 5. ReSharper Code Inspection
    Write-Header "🔍 ReSharper Code Analysis"
    
    $resharperOutputFile = Join-Path $reportsDir "resharper-report.xml"
    
    if (Test-Command "jb") {
        try {
            $resharperCmd = "jb inspectcode WorkFlo.sln --output=`"$resharperOutputFile`" --format=Xml --severity=WARNING"
            Invoke-Expression $resharperCmd
            
            if (Test-Path $resharperOutputFile) {
                [xml]$resharperXml = Get-Content $resharperOutputFile
                $issues = $resharperXml.Report.Issues.Project.Issue
                $issueCount = if ($issues) { $issues.Count } else { 0 }
                
                if ($issueCount -eq 0) {
                    Add-CheckResult "ReSharper Analysis" "PASS" "No code issues found" $resharperOutputFile
                } elseif ($issueCount -le 10) {
                    Add-CheckResult "ReSharper Analysis" "WARN" "$issueCount code issues found (acceptable threshold)" $resharperOutputFile
                } else {
                    Add-CheckResult "ReSharper Analysis" "FAIL" "$issueCount code issues found (exceeds threshold of 10)" $resharperOutputFile
                }
            } else {
                Add-CheckResult "ReSharper Analysis" "FAIL" "ReSharper report file not generated"
            }
        }
        catch {
            Add-CheckResult "ReSharper Analysis" "FAIL" "ReSharper analysis failed: $($_.Exception.Message)"
        }
    } else {
        Add-CheckResult "ReSharper Analysis" "SKIP" "ReSharper CLI tools not available"
    }

    # 6. Security Analysis
    Write-Header "🛡️ Security Analysis"
    
    try {
        # Check for hardcoded secrets using basic patterns
        $secretPatterns = @(
            "password\s*=",
            "connectionstring\s*=",
            "apikey\s*=",
            "secret\s*=",
            "token\s*="
        )
        
        $secretFindings = @()
        foreach ($pattern in $secretPatterns) {
            $matches = Get-ChildItem -Path "src" -Recurse -Include "*.cs" | 
                       Select-String -Pattern $pattern -CaseSensitive:$false
            $secretFindings += $matches
        }
        
        if ($secretFindings.Count -eq 0) {
            Add-CheckResult "Security Scan" "PASS" "No potential secrets found in source code"
        } else {
            Add-CheckResult "Security Scan" "WARN" "$($secretFindings.Count) potential secret patterns found - manual review required"
        }
    }
    catch {
        Add-CheckResult "Security Scan" "WARN" "Security scan failed: $($_.Exception.Message)"
    }

    # 7. Unit Tests
    if (-not $SkipTests) {
        Write-Header "🧪 Unit Tests"
        
        try {
            $testOutput = dotnet test --no-build --verbosity minimal --logger "trx;LogFileName=test-results.trx" 2>&1
            $testResultsFile = Get-ChildItem -Path . -Recurse -Name "test-results.trx" | Select-Object -First 1
            
            if ($LASTEXITCODE -eq 0) {
                if ($testResultsFile) {
                    [xml]$testXml = Get-Content $testResultsFile
                    $totalTests = $testXml.TestRun.ResultSummary.Counters.total
                    $passedTests = $testXml.TestRun.ResultSummary.Counters.passed
                    $failedTests = $testXml.TestRun.ResultSummary.Counters.failed
                    
                    if ($failedTests -eq 0) {
                        Add-CheckResult "Unit Tests" "PASS" "$passedTests/$totalTests tests passed" $testResultsFile
                    } else {
                        Add-CheckResult "Unit Tests" "FAIL" "$failedTests/$totalTests tests failed" $testResultsFile
                    }
                } else {
                    Add-CheckResult "Unit Tests" "PASS" "All tests passed (results file not found)"
                }
            } else {
                Add-CheckResult "Unit Tests" "FAIL" "Test execution failed"
            }
        }
        catch {
            Add-CheckResult "Unit Tests" "FAIL" "Test execution error: $($_.Exception.Message)"
        }
    } else {
        Add-CheckResult "Unit Tests" "SKIP" "Skipped by user request"
    }

    # 8. Code Coverage
    if (-not $SkipCoverage -and -not $SkipTests) {
        Write-Header "📊 Code Coverage"
        
        try {
            # Install coverlet if not already installed
            dotnet add package coverlet.msbuild --version 6.0.0 2>&1 | Out-Null
            
            $coverageOutput = dotnet test --no-build --collect:"XPlat Code Coverage" --settings coverlet.runsettings 2>&1
            
            # Find coverage files
            $coverageFiles = Get-ChildItem -Path . -Recurse -Name "coverage.cobertura.xml"
            
            if ($coverageFiles) {
                # Parse coverage percentage (simplified)
                $coverageFile = $coverageFiles | Select-Object -First 1
                [xml]$coverageXml = Get-Content $coverageFile
                $lineRate = [double]$coverageXml.coverage.'line-rate'
                $coveragePercent = [math]::Round($lineRate * 100, 2)
                
                if ($coveragePercent -ge 80) {
                    Add-CheckResult "Code Coverage" "PASS" "$coveragePercent% line coverage (target: 80%)" $coverageFile
                } elseif ($coveragePercent -ge 60) {
                    Add-CheckResult "Code Coverage" "WARN" "$coveragePercent% line coverage (target: 80%)" $coverageFile
                } else {
                    Add-CheckResult "Code Coverage" "FAIL" "$coveragePercent% line coverage (below minimum 60%)" $coverageFile
                }
            } else {
                Add-CheckResult "Code Coverage" "WARN" "Coverage report not generated"
            }
        }
        catch {
            Add-CheckResult "Code Coverage" "WARN" "Coverage analysis failed: $($_.Exception.Message)"
        }
    } else {
        Add-CheckResult "Code Coverage" "SKIP" "Skipped (tests disabled or by user request)"
    }

    # 9. Documentation Check
    Write-Header "📚 Documentation Verification"
    
    $requiredDocs = @("README.md", "CLAUDE.md", "docs/domain-glossary.md")
    $missingDocs = @()
    
    foreach ($doc in $requiredDocs) {
        if (-not (Test-Path $doc)) {
            $missingDocs += $doc
        }
    }
    
    if ($missingDocs.Count -eq 0) {
        Add-CheckResult "Documentation" "PASS" "All required documentation files present"
    } else {
        Add-CheckResult "Documentation" "WARN" "Missing documentation: $($missingDocs -join ', ')"
    }

    # 10. Git Status Check
    Write-Header "📝 Git Status"
    
    try {
        $gitStatus = git status --porcelain 2>&1
        if ($gitStatus) {
            $changedFiles = ($gitStatus -split "`n").Count
            Add-CheckResult "Git Status" "INFO" "$changedFiles files have changes"
        } else {
            Add-CheckResult "Git Status" "PASS" "Working directory is clean"
        }
    }
    catch {
        Add-CheckResult "Git Status" "WARN" "Could not check git status: $($_.Exception.Message)"
    }

    # Calculate overall status
    $endTime = Get-Date
    $results.Duration = $endTime - $startTime
    
    if ($results.Summary.Failed -gt 0) {
        $results.OverallStatus = "FAILED"
    } elseif ($results.Summary.Warnings -gt 0) {
        $results.OverallStatus = "PASSED_WITH_WARNINGS"
    } else {
        $results.OverallStatus = "PASSED"
    }

    # Generate HTML Report
    Write-Header "📋 Generating Quality Report"
    
    $htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>WorkFlo PR Quality Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #007acc; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007acc; }
        .status-PASSED { color: #28a745; }
        .status-FAILED { color: #dc3545; }
        .status-PASSED_WITH_WARNINGS { color: #ffc107; }
        .checks { margin-top: 20px; }
        .check { margin-bottom: 15px; padding: 15px; border-radius: 6px; border-left: 4px solid; }
        .check.PASS { background: #d4edda; border-color: #28a745; }
        .check.FAIL { background: #f8d7da; border-color: #dc3545; }
        .check.WARN { background: #fff3cd; border-color: #ffc107; }
        .check.SKIP { background: #e2e3e5; border-color: #6c757d; }
        .check.INFO { background: #d1ecf1; border-color: #17a2b8; }
        .check-name { font-weight: bold; margin-bottom: 5px; }
        .check-details { font-size: 0.9em; opacity: 0.8; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; }
        .timestamp { font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 WorkFlo PR Quality Report</h1>
            <h2 class="status-$($results.OverallStatus)">$($results.OverallStatus)</h2>
            <p class="timestamp">Generated: $($results.Timestamp.ToString('yyyy-MM-dd HH:mm:ss')) | Duration: $([math]::Round($results.Duration.TotalMinutes, 2)) minutes</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number status-PASSED">$($results.Summary.Passed)</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number status-FAILED">$($results.Summary.Failed)</div>
            </div>
            <div class="summary-card">
                <h3>Warnings</h3>
                <div class="number" style="color: #ffc107;">$($results.Summary.Warnings)</div>
            </div>
            <div class="summary-card">
                <h3>Skipped</h3>
                <div class="number" style="color: #6c757d;">$($results.Summary.Skipped)</div>
            </div>
        </div>
        
        <div class="checks">
            <h3>Quality Check Results</h3>
"@

    foreach ($check in $results.Checks) {
        $htmlReport += @"
            <div class="check $($check.Status)">
                <div class="check-name">$($check.Name)</div>
                <div class="check-details">$($check.Details)</div>
                $(if ($check.OutputFile) { "<div class="check-details"><strong>Output:</strong> $($check.OutputFile)</div>" })
            </div>
"@
    }

    $htmlReport += @"
        </div>
        
        <div class="footer">
            <p>Generated by WorkFlo PR Quality Check Script</p>
            <p>For more information, see <code>scripts/README.md</code></p>
        </div>
    </div>
</body>
</html>
"@

    # Save HTML report
    $htmlReport | Out-File -FilePath $OutputPath -Encoding UTF8
    Add-CheckResult "Report Generation" "PASS" "Quality report saved to $OutputPath" $OutputPath

    # Summary
    Write-Header "📊 Quality Check Summary"
    Write-Info "Overall Status: $($results.OverallStatus)"
    Write-Info "Passed: $($results.Summary.Passed)"
    Write-Info "Failed: $($results.Summary.Failed)"
    Write-Info "Warnings: $($results.Summary.Warnings)"
    Write-Info "Skipped: $($results.Summary.Skipped)"
    Write-Info "Duration: $([math]::Round($results.Duration.TotalMinutes, 2)) minutes"
    Write-Info "Report: $OutputPath"

    # Exit with appropriate code
    if ($results.Summary.Failed -gt 0) {
        Write-Error "❌ Quality checks FAILED! $($results.Summary.Failed) critical issues found."
        Write-Info "Review the report and fix issues before submitting PR."
        exit 1
    } elseif ($results.Summary.Warnings -gt 0) {
        Write-Warning "⚠️  Quality checks PASSED with $($results.Summary.Warnings) warnings."
        Write-Info "Consider addressing warnings before submitting PR."
        exit 0
    } else {
        Write-Success "✅ All quality checks PASSED! Ready to submit PR."
        exit 0
    }

} catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    Add-CheckResult "Script Execution" "FAIL" $_.Exception.Message
    exit 1
} finally {
    Set-Location $PSScriptRoot
}