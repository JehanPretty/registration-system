@echo off
echo ============================================
echo  Fixing Backend Firewall Rules (Port 8000)
echo ============================================
echo.

echo Adding rule for Uvicorn Backend (port 8000)...
netsh advfirewall firewall delete rule name="Backend Port 8000" >nul 2>&1
netsh advfirewall firewall add rule name="Backend Port 8000" dir=in action=allow protocol=TCP localport=8000

echo.
echo ============================================
echo  Done! Port 8000 is now open.
echo ============================================
pause
