# WorkFlo Windows Troubleshooting Guide

## Antivirus and Security Issues

### Issue: Windows Defender Blocks Execution
**Symptoms:**
- "Windows protected your PC" message
- Files quarantined automatically
- SmartScreen warnings

**Solutions:**

#### Option 1: Add Exclusions (Recommended)
1. Open Windows Security (Windows Defender)
2. Go to **Virus & threat protection**
3. Click **Manage settings** under "Virus & threat protection settings"
4. Scroll down to **Exclusions** and click **Add or remove exclusions**
5. Add these folder exclusions:
   ```
   C:\Program Files\WorkFlo\
   ```

#### Option 2: Temporarily Disable Real-time Protection
1. Open Windows Security
2. Go to **Virus & threat protection**
3. Click **Manage settings** under "Virus & threat protection settings"
4. Turn off **Real-time protection** temporarily
5. Install and test WorkFlo
6. **Important:** Turn real-time protection back on

#### Option 3: SmartScreen Override
When you see "Windows protected your PC":
1. Click **More info**
2. Click **Run anyway**
3. This may need to be done for both CLI and API executables

### Issue: Corporate Antivirus Blocking
**For Enterprise/Corporate Environments:**

1. **Contact IT Administrator:**
   - Request adding WorkFlo directory to antivirus exclusions
   - Provide this troubleshooting guide to IT team

2. **Portable Installation:**
   - Extract files to user directory instead of Program Files
   - Run from `%USERPROFILE%\WorkFlo\` instead

3. **Request Code Signing:**
   - Ask IT to whitelist the specific file hashes
   - Provide SHA256 checksums of executables

## CLI Command Issues

### Issue: `workflo start` Fails with Script Error
**Error:** `The system cannot find the file specified`

**Cause:** Windows version has shell script dependencies not yet implemented.

**Workaround:**
Use alternative commands that work:
```cmd
# Instead of: workflo start
# Use these working commands:

workflo install --force          # Setup git hooks
workflo serve                   # Start API server  
workflo --help                  # Show available commands
workflo --version               # Check version
```

**Status:** Bug documented in WINDOWS-COMPATIBILITY-BUGS.md

### Issue: Git Hook Installation Conflicts
**Error:** `Hook 'pre-commit' already exists`

**Solution:**
```cmd
workflo install --force
```

This will overwrite existing hooks. Back up existing hooks first if needed.

## Performance and System Issues

### Issue: High CPU Usage
**Cause:** API server scanning large repositories

**Solutions:**
1. **Configure Git Ignore:**
   Add WorkFlo data directory to `.gitignore`:
   ```
   .workflo/
   workflo.db
   ```

2. **Limit Repository Size:**
   - Use WorkFlo in smaller, focused repositories
   - Exclude large binary files from scanning

### Issue: Firewall Warnings
**Cause:** API server opens network port 5016

**Solutions:**
1. **Allow Through Firewall:**
   - Click "Allow access" when Windows asks
   - API only binds to localhost (127.0.0.1)

2. **Manual Firewall Rule:**
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "WorkFlo API" -Direction Inbound -Protocol TCP -LocalPort 5016 -Action Allow
   ```

## Installation Issues

### Issue: "Access Denied" During Installation
**Cause:** Insufficient permissions

**Solution:**
1. Right-click PowerShell/Command Prompt
2. Select "Run as administrator"
3. Run installation script again

### Issue: PATH Not Updated
**Symptom:** `workflo` command not found after installation

**Solution:**
1. **Restart Terminal:** Close and reopen PowerShell/Command Prompt
2. **Manual PATH Check:**
   ```powershell
   $env:PATH -split ';' | Where-Object { $_ -like "*WorkFlo*" }
   ```
3. **Manual PATH Addition:**
   ```powershell
   # Temporary (current session only)
   $env:PATH += ";C:\Program Files\WorkFlo\cli"
   
   # Permanent (requires restart)
   [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files\WorkFlo\cli", "Machine")
   ```

### Issue: Service Installation Fails
**Error:** Service creation failures

**Solution:**
1. **Run as Administrator:**
   ```cmd
   "C:\Program Files\WorkFlo\install-service.bat"
   ```

2. **Manual Service Creation:**
   ```cmd
   sc create WorkFloAPI binPath= "C:\Program Files\WorkFlo\api\WorkFlo.Api.exe" start= auto
   sc description WorkFloAPI "WorkFlo API Service"
   sc start WorkFloAPI
   ```

## Database Issues

### Issue: SQLite Database Errors
**Symptoms:** Database connection failures

**Solutions:**
1. **Check Permissions:**
   Ensure WorkFlo can write to data directory:
   ```powershell
   Test-Path "C:\Program Files\WorkFlo\data" -PathType Container
   ```

2. **Recreate Database:**
   ```powershell
   Remove-Item "C:\Program Files\WorkFlo\data\workflo.db" -Force
   # Restart WorkFlo API to recreate database
   ```

3. **Use User Directory:**
   Edit `workflo-config.json`:
   ```json
   {
     "Database": {
       "ConnectionString": "Data Source=%USERPROFILE%\\WorkFlo\\workflo.db"
     }
   }
   ```

## Getting Help

### Diagnostic Information to Collect
When reporting issues, include:

```powershell
# System Information
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, WindowsBuildLabEx

# WorkFlo Version
& "C:\Program Files\WorkFlo\cli\WorkFlo.Cli.exe" --version

# PATH Check
$env:PATH -split ';' | Where-Object { $_ -like "*WorkFlo*" }

# Service Status
Get-Service -Name "WorkFloAPI" -ErrorAction SilentlyContinue

# File Permissions
Get-Acl "C:\Program Files\WorkFlo" | Format-List
```

### Log Locations
- **CLI Logs:** Console output during command execution
- **API Logs:** Console output when running `workflo serve`
- **Service Logs:** Windows Event Viewer → Windows Logs → Application
- **Installation Logs:** PowerShell/Command Prompt output

### Known Working Configurations
✅ **Confirmed Working:**
- Windows 10 21H2+ with Windows Defender
- Windows 11 with default security settings
- PowerShell 5.1 and PowerShell 7+
- Command Prompt (cmd.exe)
- Git for Windows 2.40+

⚠️ **Known Issues:**
- Corporate antivirus (McAfee, Norton, etc.)
- Windows Server 2016 (untested)
- Windows Subsystem for Linux (WSL) - use Linux version instead

---

**Last Updated:** 2025-01-22  
**For additional support:** See main WorkFlo documentation or create an issue report