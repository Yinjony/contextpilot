@echo off
setlocal
chcp 65001 >nul
title ContextPilot OpenCode Installer

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1"
set "INSTALL_RESULT=%ERRORLEVEL%"

echo.
if not "%INSTALL_RESULT%"=="0" (
  echo 安装未完成，请查看上方错误信息。
)
pause
exit /b %INSTALL_RESULT%
