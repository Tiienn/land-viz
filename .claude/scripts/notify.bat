@echo off
REM Quick notification batch file for Claude task completion
REM Usage: notify.bat "Task description"

if "%~1"=="" (
    echo Usage: notify.bat "Task description"
    exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0notify-completion.ps1" -Message "%~1"
