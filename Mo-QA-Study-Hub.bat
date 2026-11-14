@echo off
chcp 65001 >nul
set "HUB=G:\JSTest\LearnProject\learning-hub\indexHome.html"
if not exist "%HUB%" (
  echo Khong tim thay: %HUB%
  pause
  exit /b 1
)
start "" "%HUB%"
