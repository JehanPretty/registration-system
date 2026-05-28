@echo off
echo =======================================================
echo  Fixing Firewall Rules for Mobile Access (8000 ^& 5173)
echo =======================================================
echo.

:: Requesting administrative privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running with administrative privileges.
    
    echo Opening Port 8000 (Backend)...
    netsh advfirewall firewall delete rule name="Regisys Backend 8000" >nul 2>&1
    netsh advfirewall firewall add rule name="Regisys Backend 8000" dir=in action=allow protocol=TCP localport=8000
    
    echo Opening Port 5173 (Frontend)...
    netsh advfirewall firewall delete rule name="Regisys Frontend 5173" >nul 2>&1
    netsh advfirewall firewall add rule name="Regisys Frontend 5173" dir=in action=allow protocol=TCP localport=5173
    
    echo.
    echo [SUCCESS] Firewall rules added!
    echo Please try accessing http://192.168.1.121:5173 on your phone now.
    echo.
    pause
) else (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
)
