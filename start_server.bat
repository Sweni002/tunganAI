@echo off
REM ============================================================
REM  start_flask_cluster.bat
REM
REM  Lance les deux instances Flask (TONGAN'AI) au demarrage
REM  Windows :
REM    - Instance 1 : port 5000, scheduler ACTIF
REM    - Instance 2 : port 5001, scheduler INACTIF
REM
REM  Avant tout lancement :
REM    1. Active le venv du backend
REM    2. Verifie que Memurai/Redis repond bien PONG
REM       (attend et reessaie tant que ce n'est pas le cas)
REM
REM  A placer dans le dossier de demarrage Windows pour un
REM  lancement automatique a la connexion :
REM    Win + R  ->  shell:startup
REM  puis copier un raccourci de ce fichier dans ce dossier.
REM ============================================================

setlocal enabledelayedexpansion

set "BACKEND_DIR=D:\tunganAI\tunganAI\backend"
set "VENV_ACTIVATE=%BACKEND_DIR%\.venv\Scripts\activate.bat"
set "NGINX_DIR=D:\nginx\cNginx"
set "NGINX_EXE=%NGINX_DIR%\nginx.exe"

echo ============================================================
echo   TONGAN'AI - Demarrage du cluster Flask (2 instances)
echo ============================================================
echo.

REM ------------------------------------------------------------
REM  1. Verification du dossier backend
REM ------------------------------------------------------------
if not exist "%BACKEND_DIR%" (
    echo [ERREUR] Dossier backend introuvable : %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%VENV_ACTIVATE%" (
    echo [ERREUR] venv introuvable : %VENV_ACTIVATE%
    echo Verifie que le dossier .venv existe bien dans %BACKEND_DIR%
    pause
    exit /b 1
)

REM ------------------------------------------------------------
REM  2. Activation du venv (dans CE script, pour redis-cli ping)
REM ------------------------------------------------------------
echo [INFO] Activation du venv...
call "%VENV_ACTIVATE%"

REM ------------------------------------------------------------
REM  3. Attente de Memurai/Redis (PONG obligatoire avant de lancer)
REM ------------------------------------------------------------
echo [INFO] Verification de Memurai/Redis...

:CHECK_REDIS
set "REDIS_OK="

REM memurai-cli confirme disponible dans le PATH sur cette machine
for /f "delims=" %%A in ('memurai-cli ping 2^>nul') do (
    if "%%A"=="PONG" set "REDIS_OK=1"
)

if defined REDIS_OK (
    echo [OK] Memurai/Redis repond PONG.
    goto REDIS_READY
)

echo [ATTENTE] Memurai/Redis ne repond pas encore. Nouvelle tentative dans 5s...
timeout /t 5 /nobreak >nul
goto CHECK_REDIS

:REDIS_READY
echo.

REM ------------------------------------------------------------
REM  4. Lancement de l'instance 1 (port 5000, scheduler actif)
REM ------------------------------------------------------------
echo [INFO] Lancement Instance 1 (port 5000, scheduler ACTIF)...
start "Flask - Instance 1 (5000)" cmd /k ^
    "cd /d "%BACKEND_DIR%" && call "%VENV_ACTIVATE%" && set FLASK_PORT=5000 && set ENABLE_SCHEDULER=true && python main.py"

REM Petit delai pour eviter les collisions au demarrage (db.create_all, etc.)
timeout /t 5 /nobreak >nul

REM ------------------------------------------------------------
REM  5. Lancement de l'instance 2 (port 5001, scheduler inactif)
REM ------------------------------------------------------------
echo [INFO] Lancement Instance 2 (port 5001, scheduler INACTIF)...
start "Flask - Instance 2 (5001)" cmd /k ^
    "cd /d "%BACKEND_DIR%" && call "%VENV_ACTIVATE%" && set FLASK_PORT=5001 && set ENABLE_SCHEDULER=false && python main.py"

echo.
echo ============================================================
echo   Les deux instances sont lancees dans des fenetres separees.
echo ============================================================
echo.

REM ------------------------------------------------------------
REM  6. Demarrage de Nginx (uniquement s'il n'est pas deja lance)
REM ------------------------------------------------------------
echo [INFO] Verification de Nginx...

REM Laisse un court instant aux instances Flask pour bien demarrer
REM avant que Nginx ne commence a leur envoyer du trafic.
timeout /t 5 /nobreak >nul

tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if %errorlevel%==0 (
    echo [OK] Nginx est deja en cours d'execution. Rien a faire.
) else (
    if not exist "%NGINX_EXE%" (
        echo [ERREUR] nginx.exe introuvable : %NGINX_EXE%
        echo Verifie le chemin NGINX_DIR dans ce script.
    ) else (
        echo [INFO] Nginx n'est pas lance. Demarrage...
        pushd "%NGINX_DIR%"
        start "" /D "%NGINX_DIR%" "%NGINX_EXE%"
        popd

        REM Petite pause puis verification que le demarrage a reussi
        timeout /t 3 /nobreak >nul
        tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
        if %errorlevel%==0 (
            echo [OK] Nginx demarre avec succes.
        ) else (
            echo [ERREUR] Nginx n'a pas demarre. Verifie %NGINX_DIR%\logs\error.log
        )
    )
)

echo.
echo ============================================================
echo   Sequence de demarrage terminee.
echo ============================================================

endlocal
exit /b 0