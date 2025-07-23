# Windows Compatibility Issues

## Overview
This document tracks known issues with WorkFlo CLI on Windows platforms discovered during the Windows release build testing.

## Critical Issues

### 1. Shell Script Dependencies in StartCommand
**Status:** 🔴 Critical  
**Component:** CLI - StartCommand  
**File:** `src/WorkFlo.Cli/Commands/StartCommand.cs`

**Issue:**
The `workflo start` command attempts to execute Unix shell scripts that don't exist in Windows builds:
- `./scripts/enhanced-start-work.sh`
- `./scripts/start-subissue-work.sh` 
- `./scripts/create-feature-branches.sh`

**Error Message:**
```
Error starting workflow: An error occurred trying to start process './scripts/enhanced-start-work.sh' with working directory 'C:\Code\Pomo'. The system cannot find the file specified.
```

**Impact:** 
- `workflo start` command completely non-functional on Windows
- Blocks core workflow functionality

**Root Cause:**
- Commands hardcoded to use Unix shell scripts
- No Windows-specific implementation provided
- Scripts not included in Windows build artifacts

**Proposed Solution:**
1. Replace shell script calls with native C# implementations
2. Create cross-platform ProcessService abstractions
3. Implement Windows-compatible workflow logic directly in CLI

### 2. Git Hook Force Installation Required
**Status:** 🟡 Minor  
**Component:** CLI - InstallCommand  

**Issue:**
`workflo install` fails when pre-existing git hooks are present, requiring `--force` flag.

**Error Message:**
```
Installation failed: Hook 'pre-commit' already exists. Use --force to overwrite.
```

**Impact:**
- Installation friction for users with existing git hooks
- Poor user experience for first-time setup

**Proposed Solution:**
1. Improve conflict detection and resolution
2. Offer backup/merge options for existing hooks
3. Better error messaging with suggested next steps

### 3. Windows Antivirus False Positives
**Status:** 🟡 Moderate  
**Component:** CLI/API Executables  
**File:** `WorkFlo.Cli.exe`, `WorkFlo.Api.exe`

**Issue:**
Windows Defender and other antivirus software flag WorkFlo executables as potentially dangerous, preventing execution or quarantining files.

**Impact:**
- Users cannot run WorkFlo after installation
- Files get quarantined automatically
- Poor first-run experience
- Enterprise environments may block deployment

**Root Cause:**
- Unsigned executables trigger security warnings
- Self-contained .NET apps often flagged as suspicious
- No established reputation with Microsoft SmartScreen
- Heuristic analysis flags process creation capabilities

**Proposed Solutions:**

#### Short-term:
1. **Code Signing Certificate**
   - Purchase EV (Extended Validation) code signing certificate
   - Sign all executable files before distribution
   - Improves SmartScreen reputation over time

2. **Antivirus Exclusion Documentation**
   ```
   Add these paths to antivirus exclusions:
   - C:\Program Files\WorkFlo\
   - %USERPROFILE%\AppData\Local\WorkFlo\
   ```

3. **Alternative Distribution**
   - Provide Windows Store package (signed automatically)
   - Use Chocolatey package manager
   - Offer portable zip version for testing

#### Long-term:
1. **Microsoft Partner Network**
   - Join Microsoft Partner Network for better reputation
   - Submit to Microsoft for analysis
   - Work with Windows Defender team on whitelist

2. **Build Optimization**
   - Minimize external process calls that trigger heuristics
   - Use Windows APIs instead of shell commands
   - Reduce file system access patterns that look suspicious

## Windows Build Status

### ✅ Successfully Built Components
- **CLI Executable:** `WorkFlo.Cli.exe` (155KB)
- **API Server:** `WorkFlo.Api.exe` (155KB) 
- **Web Frontend:** Next.js production build (44MB)
- **Installation Scripts:** PowerShell and Batch installers
- **Self-contained:** No .NET runtime dependency

### ✅ Working Features
- Basic CLI help and version commands
- Git hook installation (with `--force`)
- API server functionality
- Database setup (SQLite auto-creation)

### 🔴 Broken Features
- `workflo start` - Shell script dependency
- Enhanced workflow commands dependent on scripts
- Interactive issue selection
- Feature branch creation workflow

## Development Environment Testing

**Test Environment:**
- OS: Windows 10/11
- PowerShell 5.1+
- Git repository: C:\Code\Pomo
- Installation: C:\Program Files\WorkFlo

**Test Results:**
```powershell
PS C:\Code\Pomo> workflo --version
WorkFlo CLI v0.1.0                    # ✅ PASS

PS C:\Code\Pomo> workflo --help       
[Shows help text]                     # ✅ PASS

PS C:\Code\Pomo> workflo install --force
Installing WorkFlo git hooks...       # ✅ PASS

PS C:\Code\Pomo> workflo start
Error starting workflow: [shell script error]  # 🔴 FAIL
```

## Recommended Fixes

### Priority 1: Replace Shell Script Dependencies
```csharp
// Instead of calling shell scripts, implement logic directly:
public async Task<ProcessResult> StartInteractiveWorkflow()
{
    // Native C# implementation
    // 1. Query GitHub API for issues
    // 2. Present interactive selection
    // 3. Create branches using GitService
    // 4. Update local workspace
}
```

### Priority 2: Cross-Platform Process Abstraction
```csharp
public interface IWorkflowService
{
    Task<Result> StartWorkOnIssue(int issueNumber);
    Task<Result> CreateFeatureBranches(int issueNumber);
    Task<Result> StartSubissue(int issue, int subissue);
}
```

### Priority 3: Graceful Degradation
- Detect missing scripts and provide helpful error messages
- Offer Windows-compatible alternatives
- Guide users to available functionality

## Testing Checklist for Future Releases

### Windows Compatibility
- [ ] All CLI commands execute without shell dependencies
- [ ] Git operations work across Windows/Unix line endings
- [ ] File path handling uses cross-platform APIs
- [ ] Process execution uses proper Windows conventions

### Installation Testing
- [ ] PowerShell installation script works
- [ ] Batch file installation works  
- [ ] PATH environment variable updates correctly
- [ ] Desktop shortcuts function properly
- [ ] Uninstall script removes all components

### Functional Testing
- [ ] `workflo install` handles existing hooks gracefully
- [ ] `workflo start` works without external scripts
- [ ] `workflo serve` starts API server successfully
- [ ] All workflow commands function end-to-end

## Related Files
- `src/WorkFlo.Cli/Commands/StartCommand.cs` - Main issue location
- `build/windows/install.ps1` - Installation script
- `build/windows/install.bat` - Alternative installer
- `build/windows/README.md` - Windows documentation

## Next Steps
1. **Immediate:** Document workarounds for affected users
2. **Short-term:** Implement native C# workflow logic
3. **Long-term:** Establish cross-platform testing pipeline

---
**Created:** 2025-01-22  
**Last Updated:** 2025-01-22  
**Reporter:** Development Team  
**Assignee:** TBD