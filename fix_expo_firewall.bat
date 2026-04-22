@echo off
echo ============================================
echo  Fixing Expo Firewall Rules
echo ============================================
echo.

echo Adding rule for Metro Bundler (port 8081)...
netsh advfirewall firewall delete rule name="Expo Metro Bundler" >nul 2>&1
netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081

echo Adding rule for Expo DevTools (port 19000)...
netsh advfirewall firewall delete rule name="Expo DevTools 19000" >nul 2>&1
netsh advfirewall firewall add rule name="Expo DevTools 19000" dir=in action=allow protocol=TCP localport=19000

echo Adding rule for Expo (port 19001)...
netsh advfirewall firewall delete rule name="Expo 19001" >nul 2>&1
netsh advfirewall firewall add rule name="Expo 19001" dir=in action=allow protocol=TCP localport=19001

echo Adding rule for Expo (port 19002)...
netsh advfirewall firewall delete rule name="Expo 19002" >nul 2>&1
netsh advfirewall firewall add rule name="Expo 19002" dir=in action=allow protocol=TCP localport=19002

echo.
echo ============================================
echo  Done! All Expo ports are now open.
echo  You can now run: npx expo start
echo ============================================
pause
