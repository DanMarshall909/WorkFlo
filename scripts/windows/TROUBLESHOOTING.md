# WorkFlo Windows CLI Troubleshooting Guide (WSL Integration)

## WSL Integration Issues

### Issue: WSL API Service Not Starting
**Symptoms:**
- Windows CLI reports "API service not responding"
- Connection timeout when testing WSL API
- `wsl-service.ps1 status` shows services not running

**Solutions:**

#### Option 1: Verify WSL Setup
```bash
# In WSL terminal
wsl --list --running    # Check if WSL is running
wsl --status            # Check WSL status
```

#### Option 2: Check .NET Installation in WSL
```bash
# In WSL terminal
dotnet --version        # Should show .NET 9.0+
dotnet --info          # Detailed runtime information
```

#### Option 3: Manual API Service Start
```bash
# In WSL terminal
cd /path/to/WorkFlo
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj

# API should start and show:
# "Now listening on: http://localhost:5000"
```

### Issue: WSL IP Detection Failed
**Error:** `Could not detect WSL IP automatically. Using default: 172.20.208.1`

**Cause:** Network adapter detection or WSL networking configuration issues.

**Solutions:**

#### Option 1: Manual IP Discovery
```bash
# In WSL terminal
hostname -I            # Shows WSL IP address
ip route show default  # Shows default gateway
```

#### Option 2: Update Configuration Manually
Edit `C:\Program Files\WorkFlo\workflo-config.json`:
```json
{
  "ApiUrl": "http://YOUR_ACTUAL_WSL_IP:5000",
  "WebUrl": "http://YOUR_ACTUAL_WSL_IP:3000",
  "WSLIntegration": {
    "HostIP": "YOUR_ACTUAL_WSL_IP"
  }
}
```

#### Option 3: Reset WSL Networking
```powershell
# Run as Administrator in PowerShell
wsl --shutdown
wsl                    # Restart WSL
```

### Issue: Windows Firewall Blocking WSL Communication
**Symptoms:**
- API starts in WSL but Windows CLI cannot connect
- Browser cannot access web interface
- Connection timeouts or refused connections

**Solutions:**

#### Option 1: Add Windows Firewall Rules
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "WSL WorkFlo API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "WSL WorkFlo Web" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

#### Option 2: Test Connectivity
```powershell
# Test specific WSL IP (replace with your actual IP)
Test-NetConnection -ComputerName 172.20.208.1 -Port 5000
Invoke-WebRequest -Uri "http://172.20.208.1:5000/health" -TimeoutSec 5
```

#### Option 3: Corporate/Enterprise Firewall
For corporate environments:
- Contact IT administrator to allow WSL network communication
- Request firewall rules for ports 5000 (API) and 3000 (Web)
- Consider using alternative ports if defaults are blocked

## CLI Installation Issues

### Issue: "workflo command not found" After Installation
**Cause:** System PATH not updated or terminal not restarted.

**Solutions:**

#### Option 1: Restart Terminal
1. Close all PowerShell/Command Prompt windows
2. Open new terminal window
3. Test: `workflo --version`

#### Option 2: Verify PATH Manually
```powershell
# Check if WorkFlo CLI is in PATH
$env:PATH -split ';' | Where-Object { $_ -like "*WorkFlo*" }

# Should show: C:\Program Files\WorkFlo\cli
```

#### Option 3: Add to PATH Manually
```powershell
# Temporary (current session only)
$env:PATH += ";C:\Program Files\WorkFlo\cli"

# Permanent (requires restart)
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files\WorkFlo\cli", "Machine")
```

### Issue: "Access Denied" During Installation
**Cause:** Insufficient permissions for Program Files access.

**Solution:**
1. Right-click PowerShell/Command Prompt
2. Select "Run as administrator"  
3. Run installation script again
4. Ensure User Account Control (UAC) is properly configured

### Issue: Antivirus/Windows Defender Blocking Installation
**Symptoms:**
- Files quarantined during installation
- "Windows protected your PC" warnings
- Installation fails with security errors

**Solutions:**

#### Option 1: Add Security Exclusions
1. Open Windows Security (Windows Defender)
2. Go to **Virus & threat protection**
3. Click **Manage settings** under "Virus & threat protection settings"
4. Add exclusions for:
   ```
   C:\Program Files\WorkFlo\
   ```

#### Option 2: SmartScreen Override
When you see "Windows protected your PC":
1. Click **More info**
2. Click **Run anyway**
3. Repeat for CLI executable if needed

## Network and Connectivity Issues

### Issue: WSL Services Start But Windows Cannot Connect
**Symptoms:**
- API service shows "listening on localhost:5000" in WSL
- Windows CLI reports connection errors
- `Test-NetConnection` fails from Windows

**Diagnostic Steps:**

#### Step 1: Verify WSL Networking
```bash
# In WSL terminal
ss -tlnp | grep :5000     # Check if API is listening
curl localhost:5000/health # Test local connectivity
```

#### Step 2: Check Windows WSL Network
```powershell
# Find WSL network adapter
Get-NetAdapter | Where-Object { $_.Name -like "*WSL*" }

# Check IP configuration
Get-NetIPAddress | Where-Object { $_.InterfaceAlias -like "*WSL*" }
```

#### Step 3: Test Cross-Network Communication
```bash
# In WSL - find Windows host IP
cat /etc/resolv.conf       # Shows Windows host IP
```

```powershell
# In Windows - test WSL connectivity
$wslIP = (wsl hostname -I).Trim()
Test-NetConnection -ComputerName $wslIP -Port 5000
```

### Issue: Port Conflicts
**Error:** `Address already in use` when starting API service

**Solution:**
```bash
# In WSL - find what's using the port
sudo lsof -i :5000        # Check port 5000
sudo netstat -tlnp | grep :5000

# Kill conflicting process if needed
sudo kill -9 <PID>

# Or use alternative port
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj --urls http://localhost:5001
```

Then update Windows configuration:
```json
{
  "ApiUrl": "http://WSL_IP:5001"
}
```

## Performance and System Issues

### Issue: High Memory Usage in WSL
**Cause:** .NET API service and Node.js web interface consuming resources

**Solutions:**

#### Option 1: Limit WSL Memory
Create/edit `.wslconfig` in `%USERPROFILE%`:
```ini
[wsl2]
memory=4GB
processors=2
```

Restart WSL:
```powershell
wsl --shutdown
wsl
```

#### Option 2: Run API Only (Skip Web Interface)
Start only the essential API service:
```bash
# In WSL - API only
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj
```

Skip the web interface to save resources.

### Issue: Slow API Response Times
**Symptoms:**
- CLI commands take longer than expected
- Timeouts during git hook operations

**Solutions:**

#### Option 1: Check WSL Performance
```bash
# In WSL - monitor resources
htop                      # System resource usage
systemd-analyze           # System boot performance
```

#### Option 2: Optimize .NET Configuration
```bash
# In WSL - use Release configuration
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj -c Release
```

#### Option 3: Increase Timeout Settings
Edit `workflo-config.json`:
```json
{
  "DefaultSettings": {
    "TimeoutSeconds": 30,
    "RetryAttempts": 3
  }
}
```

## Development and Build Issues

### Issue: Build Fails with Cross-Platform Compilation
**Error:** `Framework or platform not supported` during Windows build

**Solution:**
```bash
# Ensure required workloads are installed
dotnet workload list
dotnet workload install microsoft-net-sdk-blazorwebassembly-aot

# Build with explicit runtime
dotnet publish -r win-x64 --self-contained
```

### Issue: Node.js Dependencies Fail in WSL
**Error:** `npm install` fails or web interface won't start

**Solutions:**

#### Option 1: Update Node.js
```bash
# In WSL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version    # Should be 18+
```

#### Option 2: Clear npm Cache
```bash
# In WSL
cd src/web
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## Service Management Issues

### Issue: Multiple WSL Instances Running
**Symptoms:**
- Conflicting API services
- Port binding errors
- Inconsistent behavior

**Solution:**
```powershell
# Stop all WSL instances
wsl --shutdown

# List all distributions
wsl --list --verbose

# Start specific distribution
wsl -d Ubuntu
```

### Issue: WSL Service Won't Stop
**Symptoms:**
- Ctrl+C doesn't stop API service
- Process continues running after terminal close

**Solution:**
```bash
# In WSL - find and kill process
ps aux | grep dotnet
kill -15 <PID>           # Graceful stop
kill -9 <PID>            # Force stop if needed

# Or stop all .NET processes
pkill -f "dotnet.*WorkFlo"
```

## Diagnostic Information Collection

### System Information Script
Run this in PowerShell to collect diagnostic information:

```powershell
# System Information for WorkFlo Support
Write-Host "=== WorkFlo Diagnostic Information ===" -ForegroundColor Green

# Windows Version
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, WindowsBuildLabEx

# WSL Status
Write-Host "`n=== WSL Status ===" -ForegroundColor Blue
wsl --status
wsl --list --verbose

# WorkFlo Installation
Write-Host "`n=== WorkFlo Installation ===" -ForegroundColor Blue
if (Test-Path "C:\Program Files\WorkFlo\cli\WorkFlo.Cli.exe") {
    & "C:\Program Files\WorkFlo\cli\WorkFlo.Cli.exe" --version
} else {
    Write-Host "WorkFlo CLI not found"
}

# Network Configuration
Write-Host "`n=== Network Configuration ===" -ForegroundColor Blue
$wslIP = (wsl hostname -I 2>$null)
if ($wslIP) {
    Write-Host "WSL IP: $($wslIP.Trim())"
    Test-NetConnection -ComputerName $wslIP.Trim() -Port 5000 -WarningAction SilentlyContinue
} else {
    Write-Host "Cannot detect WSL IP"
}

# PATH Configuration
Write-Host "`n=== PATH Configuration ===" -ForegroundColor Blue
$env:PATH -split ';' | Where-Object { $_ -like "*WorkFlo*" }

# Configuration File
Write-Host "`n=== Configuration ===" -ForegroundColor Blue
if (Test-Path "C:\Program Files\WorkFlo\workflo-config.json") {
    Get-Content "C:\Program Files\WorkFlo\workflo-config.json"
} else {
    Write-Host "Configuration file not found"
}
```

### WSL Diagnostic Script
Run this in WSL to collect API service information:

```bash
#!/bin/bash
# WSL WorkFlo Diagnostic Information

echo "=== WSL WorkFlo Diagnostic Information ==="

# System Information
echo -e "\n=== System Information ==="
uname -a
cat /etc/os-release | head -n 2

# .NET Information
echo -e "\n=== .NET Information ==="
dotnet --version
dotnet --info | head -n 10

# Network Information
echo -e "\n=== Network Information ==="
hostname -I
ip route show default
ss -tlnp | grep :5000 || echo "No service on port 5000"

# Process Information
echo -e "\n=== Running Processes ==="
ps aux | grep -E "(dotnet|node)" | grep -v grep

# WorkFlo Files
echo -e "\n=== WorkFlo Files ==="
if [ -d "src/WorkFlo.Api" ]; then
    echo "API project found"
    ls -la src/WorkFlo.Api/
else
    echo "WorkFlo API project not found"
fi
```

## Getting Additional Help

### Log Locations
- **Windows CLI Logs**: Console output during command execution
- **WSL API Logs**: Terminal output from `dotnet run` command
- **WSL Web Logs**: Terminal output from `npm run dev:windows`
- **Installation Logs**: PowerShell/Command Prompt output during installation

### Support Checklist
When reporting issues, include:

1. **System Information**: Windows version, WSL version, WSL distribution
2. **WorkFlo Version**: Output of `workflo --version`
3. **Network Configuration**: WSL IP address, connectivity test results
4. **Error Messages**: Complete error text and stack traces
5. **Diagnostic Output**: Results from diagnostic scripts above

### Known Working Configurations
✅ **Confirmed Working:**
- Windows 10 21H2+ with WSL2 Ubuntu 20.04/22.04
- Windows 11 with default WSL configuration
- .NET 9.0+ in WSL with WorkFlo source code
- PowerShell 5.1 and PowerShell 7+ for Windows CLI

⚠️ **Known Issues:**
- Corporate antivirus blocking WSL network communication
- VPN software interfering with WSL networking
- Multiple WSL distributions with conflicting network configurations
- Windows Defender Application Guard affecting network connectivity

---

**Last Updated:** 2025-01-22  
**For additional support:** Check main WorkFlo documentation, WSL setup guide, or create an issue report with diagnostic information