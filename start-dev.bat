@echo off
REM Start de dev-server. Dubbelklik dit bestand of run vanaf cmd/PowerShell.
REM Werkt zonder PATH-issues of execution-policy gedoe.

cd /d "%~dp0"
echo Starting HSN Helpdesk Assist dev-server...
echo Open browser op http://localhost:3000
echo Stop met Ctrl+C
echo.
"C:\Program Files\nodejs\npm.cmd" run dev
pause
