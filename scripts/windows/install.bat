@echo off
:: WorkFlo Windows Installation Script (Batch Version)
:: This script installs WorkFlo CLI and API on Windows systems

setlocal enabledelayedexpansion

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges. Please run as administrator.
    pause
    exit /b 1
)

echo WorkFlo Installation Script
echo =========================

:: Set default installation path
set "INSTALL_PATH=%ProgramFiles%\WorkFlo"

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

:: Copy CLI binaries
echo Installing WorkFlo CLI...
mkdir "%INSTALL_PATH%\cli" 2>nul
xcopy /s /e /i /y "cli\*" "%INSTALL_PATH%\cli\" >nul
if %errorLevel% neq 0 (
    echo Failed to copy CLI files.
    goto :error
)

:: Copy API binaries
echo Installing WorkFlo API...
mkdir "%INSTALL_PATH%\api" 2>nul
xcopy /s /e /i /y "api\*" "%INSTALL_PATH%\api\" >nul
if %errorLevel% neq 0 (
    echo Failed to copy API files.
    goto :error
)

:: Copy Web frontend
echo Installing WorkFlo Web frontend...
mkdir "%INSTALL_PATH%\web" 2>nul
xcopy /s /e /i /y "web\*" "%INSTALL_PATH%\web\" >nul
if %errorLevel% neq 0 (
    echo Failed to copy Web files.
    goto :error
)

:: Add CLI to PATH
echo Adding WorkFlo CLI to system PATH...
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "CURRENT_PATH=%%b"
echo !CURRENT_PATH! | findstr /i "%INSTALL_PATH%\cli" >nul
if %errorLevel% neq 0 (
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /t REG_EXPAND_SZ /d "!CURRENT_PATH!;%INSTALL_PATH%\cli" /f >nul
    echo Added %INSTALL_PATH%\cli to system PATH.
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
echo oLink.Arguments = "/k ""cd /d %INSTALL_PATH%\cli && WorkFlo.Cli.exe --help""" >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_PATH%\cli" >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.Description = "WorkFlo Command Line Interface" >> "%TEMP%\create_cli_shortcut.vbs"
echo oLink.Save >> "%TEMP%\create_cli_shortcut.vbs"
cscript //nologo "%TEMP%\create_cli_shortcut.vbs"
del "%TEMP%\create_cli_shortcut.vbs"

:: API shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_api_shortcut.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\WorkFlo API Server.lnk" >> "%TEMP%\create_api_shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_api_shortcut.vbs"
echo oLink.TargetPath = "%INSTALL_PATH%\api\WorkFlo.Api.exe" >> "%TEMP%\create_api_shortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_PATH%\api" >> "%TEMP%\create_api_shortcut.vbs"
echo oLink.Description = "WorkFlo API Server" >> "%TEMP%\create_api_shortcut.vbs"
echo oLink.Save >> "%TEMP%\create_api_shortcut.vbs"
cscript //nologo "%TEMP%\create_api_shortcut.vbs"
del "%TEMP%\create_api_shortcut.vbs"

:: Create service installation batch file
echo Creating service installation script...
(
echo @echo off
echo :: WorkFlo API Service Installation
echo :: Run this script as administrator to install WorkFlo API as a Windows service
echo.
echo net session ^>nul 2^>^&1
echo if %%errorLevel%% neq 0 ^(
echo     echo This script requires administrator privileges. Please run as administrator.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo set "SERVICE_NAME=WorkFloAPI"
echo set "SERVICE_DISPLAY_NAME=WorkFlo API Service"
echo set "SERVICE_DESCRIPTION=WorkFlo AI-powered workflow enforcement API server"
echo set "SERVICE_PATH=%INSTALL_PATH%\api\WorkFlo.Api.exe"
echo.
echo :: Check if service already exists
echo sc query %%SERVICE_NAME%% ^>nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo Service %%SERVICE_NAME%% already exists. Stopping and removing...
echo     sc stop %%SERVICE_NAME%%
echo     sc delete %%SERVICE_NAME%%
echo     timeout /t 2 /nobreak ^>nul
echo ^)
echo.
echo :: Install service
echo echo Installing WorkFlo API as Windows service...
echo sc create %%SERVICE_NAME%% binPath= "%%SERVICE_PATH%%" DisplayName= "%%SERVICE_DISPLAY_NAME%%" start= auto
echo if %%errorLevel%% equ 0 ^(
echo     sc description %%SERVICE_NAME%% "%%SERVICE_DESCRIPTION%%"
echo     echo Service installed successfully. Starting service...
echo     sc start %%SERVICE_NAME%%
echo     echo WorkFlo API service is now running.
echo ^) else ^(
echo     echo Failed to install service.
echo ^)
echo pause
) > "%INSTALL_PATH%\install-service.bat"

:: Create uninstall script
echo Creating uninstall script...
(
echo @echo off
echo :: WorkFlo Uninstall Script
echo :: This script removes WorkFlo from your system
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
echo :: Stop and remove service if it exists
echo sc query WorkFloAPI ^>nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo Stopping and removing WorkFlo API service...
echo     sc stop WorkFloAPI
echo     sc delete WorkFloAPI
echo ^)
echo.
echo :: Remove from PATH
echo echo Removing from system PATH...
echo for /f "tokens=2*" %%%%a in ^('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^^^>nul'^) do set "CURRENT_PATH=%%%%b"
echo set "NEW_PATH=!CURRENT_PATH:%INSTALL_PATH%\cli;=!"
echo reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /t REG_EXPAND_SZ /d "!NEW_PATH!" /f ^>nul
echo.
echo :: Remove desktop shortcuts
echo echo Removing desktop shortcuts...
echo del "%%USERPROFILE%%\Desktop\WorkFlo CLI.lnk" 2^>nul
echo del "%%USERPROFILE%%\Desktop\WorkFlo API Server.lnk" 2^>nul
echo.
echo :: Remove installation directory
echo echo Removing installation directory...
echo rmdir /s /q "%INSTALL_PATH%" 2^>nul
echo.
echo echo WorkFlo has been uninstalled successfully.
echo echo Please restart your terminal to update PATH changes.
echo pause
) > "%INSTALL_PATH%\uninstall.bat"

:: Create default configuration
echo Creating default configuration...
(
echo {
echo   "ApiUrl": "http://localhost:5016",
echo   "WebUrl": "http://localhost:3000",
echo   "DefaultSettings": {
echo     "AutoStartApi": true,
echo     "EnableLogging": true,
echo     "LogLevel": "Information",
echo     "DatabaseProvider": "SQLite"
echo   },
echo   "Database": {
echo     "ConnectionString": "Data Source=%INSTALL_PATH%\\data\\workflo.db",
echo     "AutoMigrate": true
echo   }
echo }
) > "%INSTALL_PATH%\workflo-config.json"

:: Create data directory for SQLite database
echo Creating data directory...
mkdir "%INSTALL_PATH%\data" 2>nul

echo.
echo Installation completed successfully!
echo =========================
echo Installation Path: %INSTALL_PATH%
echo CLI Executable: %INSTALL_PATH%\cli\WorkFlo.Cli.exe
echo API Executable: %INSTALL_PATH%\api\WorkFlo.Api.exe
echo Web Frontend: %INSTALL_PATH%\web
echo Database: %INSTALL_PATH%\data\workflo.db (SQLite)
echo.
echo Next Steps:
echo 1. Restart your terminal to use 'workflo' command globally
echo 2. Run 'workflo --help' to see available commands
echo 3. Run '%INSTALL_PATH%\install-service.bat' to install API as Windows service
echo 4. Navigate to your git repository and run 'workflo install' to setup git hooks
echo.
echo To uninstall, run: %INSTALL_PATH%\uninstall.bat
echo.
pause
goto :end

:error
echo Installation failed.
pause
exit /b 1

:end