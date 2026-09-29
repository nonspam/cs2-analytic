@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY where python3 >nul 2>nul && set "PY=python3"
if not defined PY (
  echo.
  echo CS5 ANALYTICS: Python не найден.
  echo Установи Python 3 и включи Add Python to PATH.
  echo.
  pause
  exit /b 1
)
set "PORT=8000"
:CHECKPORT
%PY% -c "import socket,sys; s=socket.socket(); s.settimeout(.2); r=s.connect_ex(('127.0.0.1',int(sys.argv[1]))); s.close(); sys.exit(0 if r else 1)" %PORT% >nul 2>nul
if errorlevel 1 set /a PORT+=1 & goto CHECKPORT
start "CS5 Analytics Server" /min %PY% -m http.server %PORT% --bind 127.0.0.1
ping 127.0.0.1 -n 2 >nul
start "" "http://127.0.0.1:%PORT%/"
echo CS5 Analytics запущен: http://127.0.0.1:%PORT%/
endlocal
