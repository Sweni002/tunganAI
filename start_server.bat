@echo off
REM ============================================================
REM  start_cluster.bat
REM  Memurai -> Celery worker -> Flask x2 -> Nginx
REM ============================================================

setlocal enabledelayedexpansion

set "BACKEND_DIR=D:\tunganAI\tunganAI\backend"
set "VENV_ACTIVATE=%BACKEND_DIR%\.venv\Scripts\activate.bat"
set "NGINX_DIR=D:\nginx\cNginx"
set "NGINX_EXE=%NGINX_DIR%\nginx.exe"

echo ============================================================
echo   TONGAN'AI - Demarrage du cluster complet
echo ============================================================
echo.

REM ------------------------------------------------------------
REM  1. Verifications des dossiers
REM ------------------------------------------------------------
if not exist "%BACKEND_DIR%" (
    echo [ERREUR] Dossier backend introuvable : %BACKEND_DIR%
    pause & exit /b 1
)
if not exist "%BACKEND_DIR%\main.py" (
    echo [ERREUR] main.py introuvable dans %BACKEND_DIR%
    pause & exit /b 1
)
if not exist "%BACKEND_DIR%\celery_app.py" (
    echo [ERREUR] celery_app.py introuvable dans %BACKEND_DIR%
    pause & exit /b 1
)
if not exist "%VENV_ACTIVATE%" (
    echo [ERREUR] venv introuvable : %VENV_ACTIVATE%
    pause & exit /b 1
)

REM ------------------------------------------------------------
REM  2. Activation du venv dans CE shell (pour memurai-cli)
REM ------------------------------------------------------------
echo [INFO] Activation du venv...
call "%VENV_ACTIVATE%"

REM ------------------------------------------------------------
REM  3. Attente de Memurai/Redis
REM ------------------------------------------------------------
echo [INFO] Verification de Memurai/Redis...

:CHECK_REDIS
set "REDIS_OK="
for /f "delims=" %%A in ('memurai-cli ping 2^>nul') do (
    if "%%A"=="PONG" set "REDIS_OK=1"
)
if defined REDIS_OK (
    echo [OK] Memurai/Redis repond PONG.
    goto REDIS_READY
)
echo [ATTENTE] Memurai/Redis ne repond pas. Nouvelle tentative dans 5s...
timeout /t 5 /nobreak >nul
goto CHECK_REDIS

:REDIS_READY
echo.

REM ------------------------------------------------------------
REM  4. Verification du broker Celery (base Redis 1)
REM ------------------------------------------------------------
echo [INFO] Verification du broker Celery (Redis base 1)...

:CHECK_BROKER
set "BROKER_OK="
for /f "delims=" %%A in ('memurai-cli -n 1 ping 2^>nul') do (
    if "%%A"=="PONG" set "BROKER_OK=1"
)
if defined BROKER_OK (
    echo [OK] Broker Celery joignable.
    goto BROKER_READY
)
echo [ATTENTE] Broker Celery ne repond pas. Nouvelle tentative dans 5s...
timeout /t 5 /nobreak >nul
goto CHECK_BROKER

:BROKER_READY
echo.

REM ------------------------------------------------------------
REM  5. Lancement du worker Celery
REM ------------------------------------------------------------
echo [INFO] Lancement du worker Celery...
start "Celery Worker" cmd /k ^
  "cd /d "%BACKEND_DIR%" && call .venv\Scripts\activate.bat && celery -A celery_app.celery worker -l info -P threads -c 8 -Q pointage,pointage_lourd"

REM Laisse au worker le temps de s'enregistrer aupres du broker
timeout /t 5 /nobreak >nul

REM ------------------------------------------------------------
REM  6. Instance Flask 1 (5000, scheduler ACTIF)
REM ------------------------------------------------------------
echo [INFO] Lancement Instance 1 (port 5000, scheduler ACTIF)...
start "Flask - Instance 1 (5000)" cmd /k ^
  "cd /d "%BACKEND_DIR%" && call .venv\Scripts\activate.bat && set "FLASK_PORT=5000" && set "ENABLE_SCHEDULER=true" && set "INIT_DB=true" && set "EVENTLET_NO_GREENDNS=yes" && python main.py"

timeout /t 5 /nobreak >nul

REM ------------------------------------------------------------
REM  7. Instance Flask 2 (5001, scheduler INACTIF)
REM ------------------------------------------------------------
echo [INFO] Lancement Instance 2 (port 5001, scheduler INACTIF)...
start "Flask - Instance 2 (5001)" cmd /k ^
  "cd /d "%BACKEND_DIR%" && call .venv\Scripts\activate.bat && set "FLASK_PORT=5001" && set "ENABLE_SCHEDULER=false" && set "INIT_DB=false" && set "EVENTLET_NO_GREENDNS=yes" && python main.py"

echo.
echo ============================================================
echo   Flask + Celery lances dans des fenetres separees.
echo ============================================================
echo.

REM ------------------------------------------------------------
REM  8. Nginx
REM ------------------------------------------------------------
timeout /t 5 /nobreak >nul
echo [INFO] Verification de Nginx...

tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if %errorlevel%==0 (
    echo [OK] Nginx deja en cours.
) else (
    if not exist "%NGINX_EXE%" (
        echo [ERREUR] nginx.exe introuvable : %NGINX_EXE%
    ) else (
        echo [INFO] Demarrage Nginx...
        start "" /D "%NGINX_DIR%" "%NGINX_EXE%"
        timeout /t 3 /nobreak >nul
        tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
        if %errorlevel%==0 (
            echo [OK] Nginx demarre.
        ) else (
            echo [ERREUR] Nginx n'a pas demarre. Voir %NGINX_DIR%\logs\error.log
        )
    )
)

echo.
echo ============================================================
echo   Sequence de demarrage terminee.
echo.
echo   Fenetres ouvertes :
echo     - Celery Worker           (taches de fond)
echo     - Flask - Instance 1      (port 5000)
echo     - Flask - Instance 2      (port 5001)
echo ============================================================

endlocal
exit /b 0