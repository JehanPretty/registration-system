@echo off
title Localtunnel Auto-Restarter
:loop
echo ========================================================
echo Starting localtunnel for regisys-backend...
echo ========================================================
call npx localtunnel --port 8000 --subdomain regisys-backend
echo.
echo [!] Localtunnel crashed or lost connection. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
