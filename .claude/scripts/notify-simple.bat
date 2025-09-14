@echo off
REM Simple notification batch file that always works

if "%1"=="" (
    set "msg=Claude task completed!"
) else (
    set "msg=%1"
)

echo.
echo ==========================================
echo    🔔 CLAUDE NOTIFICATION 🔔
echo ==========================================
echo 📢 %msg%
echo ⏰ %time%
echo ==========================================
echo.

REM Create notification log
if not exist ".claude" mkdir ".claude"
echo %time% - %msg% >> .claude\notifications.txt

REM Make some noise
echo 

echo ✅ Notification logged to .claude\notifications.txt
pause
