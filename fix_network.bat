@echo off
echo =======================================================
echo Automatic network fix for Mobile App connection
echo =======================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator...
    echo Adding firewall rule to allow port 8000...
    powershell -Command "New-NetFirewallRule -DisplayName 'Allow FastAPI Port 8000' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 -ErrorAction SilentlyContinue"
    echo.
    echo [SUCCESS] Port 8000 has been opened on your firewall!
    echo.
    echo Please go to your terminal, stop Expo (Ctrl+C), and run: 
    echo npx expo start -c
    echo.
    pause
) else (
    echo Administrator privileges are required to modify the firewall.
    echo Requesting permission now...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
)
