@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY where python3 >nul 2>nul && set "PY=python3"
if not defined PY (
  echo.
  echo CS2 ANALYTICS: Python 3 не найден.
  echo Установи Python 3 и повтори запуск.
  echo.
  pause
  exit /b 1
)
set "PORT=8000"
:CHECKPORT
%PY% -c "import socket,sys; s=socket.socket(); s.settimeout(.2); r=s.connect_ex(('0.0.0.0',int(sys.argv[1]))); s.close(); sys.exit(0 if r else 1)" %PORT% >nul 2>nul
if errorlevel 1 set /a PORT+=1 & goto CHECKPORT
set "CS2_PORT=%PORT%"
start "CS2 Analytics Shared Server" /min cmd /c "set CS2_PORT=%PORT%&&%PY% server.py"
ping 127.0.0.1 -n 2 >nul
%PY% -c "import socket; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.connect(('8.8.8.8',80)); print(s.getsockname()[0]); s.close()" > "%TEMP%\cs2_ip.txt" 2>nul
set /p LANIP=<"%TEMP%\cs2_ip.txt"
start "" "http://127.0.0.1:%PORT%/"
echo.
echo ================================================
echo CS2 ANALYTICS — ОБЩИЙ СЕРВЕР
echo ================================================
echo На этом ПК: http://127.0.0.1:%PORT%/
if defined LANIP echo Для пацанов в одной сети: http://%LANIP%:%PORT%/
echo.
echo Оставь окно сервера открытым.
echo Данные теперь сохраняются в shared_state.json
if defined LANIP echo и синхронизируются между открытыми браузерами.
echo.
echo Если Windows Firewall спросит — разреши Python для частной сети.
echo ================================================
echo.
pause
endlocal
