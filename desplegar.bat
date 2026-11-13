@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title SIGESUB (Subven2) - GitHub y Despliegue en Servidor 192.168.1.201

cd /d "%~dp0"

echo ============================================================================
echo   SIGESUB (Subven2) - Gestion de Codigo (GitHub) y Despliegue (192.168.1.201)
echo ============================================================================
echo.

if /I "%~1"=="deploy" goto :DEPLOY_SERVER
if /I "%~1"=="github" goto :PUSH_GITHUB
if /I "%~1"=="docker" goto :RUN_DOCKER_LOCAL

echo Seleccione la operacion que desea realizar:
echo.
echo   [1] Guardar cambios en GitHub y actualizar Servidor (192.168.1.201:3006)
echo   [2] Solo subir cambios a GitHub (git add + commit + push)
echo   [3] Solo actualizar y reiniciar en Servidor 192.168.1.201 (git pull + docker compose)
echo   [4] Ejecutar en Docker local (este PC)
echo   [5] Salir
echo.
set /p OPCION="Introduzca una opcion (1-5) [Por defecto 1]: "
if "%OPCION%"=="" set OPCION=1

if "%OPCION%"=="1" goto :FULL_SYNC_AND_DEPLOY
if "%OPCION%"=="2" goto :PUSH_GITHUB
if "%OPCION%"=="3" goto :DEPLOY_SERVER
if "%OPCION%"=="4" goto :RUN_DOCKER_LOCAL
goto :EOF

:FULL_SYNC_AND_DEPLOY
call :DO_GITHUB_PUSH
if errorlevel 1 goto :EOF
call :DO_SERVER_DEPLOY
pause
goto :EOF

:PUSH_GITHUB
call :DO_GITHUB_PUSH
pause
goto :EOF

:DEPLOY_SERVER
call :DO_SERVER_DEPLOY
pause
goto :EOF

:DO_GITHUB_PUSH
echo.
echo === [GitHub] Preparando copia del codigo ===
set /p MSG="Mensaje del commit [Actualizacion SIGESUB]: "
if "!MSG!"=="" set MSG=Actualizacion SIGESUB
git add -A
git commit -m "!MSG!"
echo Subiendo cambios a GitHub (origin main)...
git push -u origin main
exit /b %ERRORLEVEL%

:DO_SERVER_DEPLOY
echo.
echo === [Servidor 192.168.1.201] Actualizando y desplegando en puerto 3006 ===
ssh mm@192.168.1.201 "cd ~/subven2 && git pull origin main && docker compose up -d --build"
if not errorlevel 1 (
    echo.
    echo [OK] Aplicacion desplegada en: http://192.168.1.201:3006
    start "" "http://192.168.1.201:3006"
)
exit /b %ERRORLEVEL%

:RUN_DOCKER_LOCAL
if not exist ".env" copy /Y ".env.example" ".env" >nul
docker compose up -d --build
start "" "http://localhost:3006"
pause
goto :EOF
