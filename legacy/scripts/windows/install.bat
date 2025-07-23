@echo off
:: WorkFlo Windows CLI Installation Script (Batch Version)
:: This script installs WorkFlo CLI on Windows systems to connect to WSL API

setlocal enabledelayedexpansion

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges. Please run as administrator.
    pause
    exit /b 1
)

echo WorkFlo CLI Installation Script (WSL Integration)
echo ================================================

:: Set default installation path
set "INSTALL_PATH=%ProgramFiles%\WorkFlo"

:: Function to detect WSL IP address
:DetectWSLIP
set "WSL_IP=172.20.208.1"
echo Detecting WSL network configuration...

:: Try to find WSL network adapter info
for /f "tokens=*" %%i in ('wsl hostname -I 2^>nul') do set "WSL_IP=%%i"
if defined WSL_IP (
    :: Trim whitespace
    for /f "tokens=* delims= " %%a in ("!WSL_IP!") do set "WSL_IP=%%a"
    echo WSL Host IP detected: !WSL_IP!
) else (
    echo Could not detect WSL IP automatically. Using default: !WSL_IP!
)
goto :continue

:continue
:: Check if already installed
if exist "%INSTALL_PATH%" (
    echo WorkFlo appears to be already installed at %INSTALL_PATH%
    set /p "OVERWRITE=Do you want to overwrite the existing installation? (y/N): "
    if /i not "!OVERWRITE!"=="y" (
        echo Installation cancelled.
        pause
        exit /b 0
    )
    echo Removing existing installation...
    rmdir /s /q "%INSTALL_PATH%" 2>nul
)

:: Create installation directory
echo Creating installation directory at %INSTALL_PATH%...
mkdir "%INSTALL_PATH%" 2>nul

:: Copy single-file CLI executable (API runs in WSL)
echo Installing WorkFlo CLI...
if exist "workflo.exe" (
    copy /y "workflo.exe" "%INSTALL_PATH%\workflo.exe" >nul
) else if exist "cli\WorkFlo.Cli.exe" (
    copy /y "cli\WorkFlo.Cli.exe" "%INSTALL_PATH%\workflo.exe" >nul
) else (
    echo WorkFlo CLI executable not found. Expected workflo.exe or cli\WorkFlo.Cli.exe
    goto :error
)

:: Add CLI to PATH
echo Adding WorkFlo CLI to system PATH...
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "CURRENT_PATH=%%b"
echo !CURRENT_PATH! | findstr /i "%INSTALL_PATH%" >nul
if %errorLevel% neq 0 (
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /t REG_EXPAND_SZ /d "!CURRENT_PATH!;%INSTALL_PATH%" /f >nul
    echo Added %INSTALL_PATH% to system PATH.
    echo Please restart your terminal to use the 'workflo' command globally.
) else (
    echo WorkFlo CLI path already exists in system PATH.
)

:: Create desktop shortcuts
echo Creating desktop shortcuts...

:: CLI shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_cli_shortcut.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\WorkFlo CLI.lnk" >> "%TEMP%\create_cli_shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.TargetPath = "cmd.exe" >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.Arguments = "/k ""cd /d %INSTALL_PATH% && workflo.exe --help""" >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_PATH%" >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.Description = "WorkFlo Command Line Interface" >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.Save >> "%TEMP%\create_cli_shortcut.vbs"
cscript //nologo "%TEMP%\create_cli_shortcut.vbs"
del "%TEMP%\create_cli_shortcut.vbs"

:: Web Interface shortcut (points to WSL)
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_web_shortcut.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\WorkFlo Web.lnk" >> "%TEMP%\create_web_shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_web_shortcut.vbs"
echo oLink.TargetPath = "http://!WSL_IP!:3000" >> "%TEMP%\create_web_shortcut.vbs"
echo oLink.Description = "WorkFlo Web Interface (WSL)" >> "%TEMP%\create_web_shortcut.vbs"
echo oLink.Save >> "%TEMP%\create_web_shortcut.vbs"
cscript //nologo "%TEMP%\create_web_shortcut.vbs"
del "%TEMP%\create_web_shortcut.vbs"

:: Create WSL API configuration
echo Creating WSL API configuration...
(
echo {
echo   "ApiUrl": "http://!WSL_IP!:5000",
echo   "WebUrl": "http://!WSL_IP!:3000",
echo   "WSLIntegration": {
echo     "Enabled": true,
echo     "HostIP": "!WSL_IP!",
echo     "ApiPort": 5000,
echo     "WebPort": 3000,
echo     "AutoDetectIP": true
echo   },
echo   "DefaultSettings": {
echo     "EnableLogging": true,
echo     "LogLevel": "Information"
echo   }
echo }
) > "%INSTALL_PATH%\workflo-config.json"

:: Create WSL service management batch file
echo Creating WSL service management script...
(
echo @echo off
echo :: WorkFlo WSL Service Management
echo :: This script helps check and manage the WorkFlo API service running in WSL
echo.
echo setlocal enabledelayedexpansion
echo set "WSL_IP=!WSL_IP!"
echo set "API_URL=http://!WSL_IP!:5000"
echo set "WEB_URL=http://!WSL_IP!:3000"
echo.
echo if "%%1"=="" set "ACTION=status"
echo if "%%1"=="status" set "ACTION=status"
echo if "%%1"=="start" set "ACTION=start"
echo if "%%1"=="stop" set "ACTION=stop"
echo if "%%1"=="restart" set "ACTION=restart"
echo.
echo if "%%ACTION%%"=="status" goto :status
echo if "%%ACTION%%"=="start" goto :start
echo if "%%ACTION%%"=="stop" goto :stop
echo if "%%ACTION%%"=="restart" goto :restart
echo goto :help
echo.
echo :status
echo echo WorkFlo WSL Service Status
echo echo =========================
echo.
echo :: Test API service
echo curl -s -o nul -w "API Service: %%{http_code}" "%%API_URL%%/health" 2^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo  - Running
echo ^) else ^(
echo     echo  - Not responding
echo ^)
echo.
echo :: Test Web service
echo curl -s -o nul -w "Web Service: %%{http_code}" "%%WEB_URL%%" 2^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo  - Running
echo ^) else ^(
echo     echo  - Not responding
echo ^)
echo goto :instructions
echo.
echo :start
echo echo Starting WorkFlo services in WSL...
echo goto :instructions
echo.
echo :stop
echo echo To stop WorkFlo services, use Ctrl+C in the WSL terminals where they're running.
echo goto :end
echo.
echo :restart
echo echo To restart WorkFlo services:
echo echo 1. Use Ctrl+C to stop services in WSL terminals
echo echo 2. Restart using the start instructions below
echo goto :instructions
echo.
echo :instructions
echo echo.
echo echo To start WorkFlo API in WSL:
echo echo 1. Open WSL terminal
echo echo 2. Navigate to WorkFlo directory
echo echo 3. Run: dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj
echo echo.
echo echo For web interface:
echo echo 1. In WSL, navigate to src/web/
echo echo 2. Run: npm run dev:windows
echo echo 3. Access from Windows: %%WEB_URL%%
echo goto :end
echo.
echo :help
echo echo Usage: %%~n0 [status^|start^|stop^|restart]
echo echo   status  - Check if services are running ^(default^)
echo echo   start   - Show instructions to start services
echo echo   stop    - Show instructions to stop services
echo echo   restart - Show instructions to restart services
echo.
echo :end
echo pause
) > "%INSTALL_PATH%\wsl-service.bat"

:: Create uninstall script
echo Creating uninstall script...
(
echo @echo off
echo :: WorkFlo Uninstall Script
echo :: This script removes WorkFlo CLI from your system
echo.
echo net session ^>nul 2^>^&1
echo if %%errorLevel%% neq 0 ^(
echo     echo This script requires administrator privileges. Please run as administrator.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo WorkFlo Uninstall Script
echo echo =======================
echo.
echo :: Remove from PATH
echo echo Removing from system PATH...
echo for /f "tokens=2*" %%%%a in ^('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^^^>nul'^) do set "CURRENT_PATH=%%%%b"
echo set "NEW_PATH=!CURRENT_PATH:%INSTALL_PATH%;=!"
echo reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /t REG_EXPAND_SZ /d "!NEW_PATH!" /f ^>nul
echo.
echo :: Remove desktop shortcuts
echo echo Removing desktop shortcuts...
echo del "%%USERPROFILE%%\Desktop\WorkFlo CLI.lnk" 2^>nul
echo del "%%USERPROFILE%%\Desktop\WorkFlo Web.lnk" 2^>nul
echo.
echo :: Remove installation directory
echo echo Removing installation directory...
echo rmdir /s /q "%INSTALL_PATH%" 2^>nul
echo.
echo echo WorkFlo CLI has been uninstalled successfully.
echo echo Note: WorkFlo API service in WSL was not affected.
echo echo Please restart your terminal to update PATH changes.
echo pause
) > "%INSTALL_PATH%\uninstall.bat"

echo.
echo Installation completed successfully!
echo ====================================
echo Installation Path: %INSTALL_PATH%
echo CLI Executable: %INSTALL_PATH%\workflo.exe
echo WSL API URL: http://!WSL_IP!:5000
echo WSL Web URL: http://!WSL_IP!:3000
echo.
echo Next Steps:
echo 1. Restart your terminal to use 'workflo' command globally
echo 2. Set up WorkFlo API service in WSL (see instructions below)
echo 3. Run '%INSTALL_PATH%\wsl-service.bat status' to check WSL services
echo 4. Navigate to your git repository and run 'workflo install' to setup git hooks
echo.
echo WSL Setup Instructions:
echo 1. Open WSL terminal
echo 2. Navigate to WorkFlo source directory
echo 3. Run: dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj
echo 4. For web interface: cd src/web ^&^& npm run dev:windows
echo.
echo To uninstall: %INSTALL_PATH%\uninstall.bat
echo.
pause
goto :end

:error
echo Installation failed.
pause
exit /b 1

:end