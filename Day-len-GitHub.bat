@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "URL=https://github.com/tunglb2004/LearnAutoPerform.git"
where git >nul 2>nul || (echo Chua cai Git. Tai tai https://git-scm.com roi chay lai. & pause & exit /b 1)
if not exist ".git" (
  git init -b main
  git remote add origin %URL%
  git fetch origin
  git reset origin/main
) else (
  git remote set-url origin %URL%
)
git add -A
git commit -m "Them video bai giang (540p) va nut xem video theo moc thoi gian"
git push -u origin main
echo.
echo Xong. Neu Pages chua bat: Settings ^> Pages ^> Deploy from a branch ^> main ^> / (root).
pause
