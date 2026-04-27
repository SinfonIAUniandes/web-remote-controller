@echo off
REM ============================================
REM Script de inicio para Robot Pepper
REM Abre 4 terminales SSH + 1 terminal local
REM ============================================

REM CONFIGURACION - EDITAR AQUI
set PEPPER_IP=192.168.0.208
set PEPPER_USER=nao
set PEPPER_PASSWORD=0_0
set WORKSPACE_PATH=/gentoo/startprefix

REM ============================================
REM NO EDITAR DEBAJO DE ESTA LINEA
REM ============================================

echo.
echo ============================================
echo   Iniciando Robot Pepper - Control Remoto
echo ============================================
echo.

REM Verificar si Git Bash esta instalado
if not exist "C:\Program Files\Git\bin\bash.exe" (
    echo ERROR: Git Bash no encontrado en C:\Program Files\Git\bin\bash.exe
    echo Por favor instala Git desde https://git-scm.com/
    echo.
    pause
    exit /b 1
)

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo ADVERTENCIA: node_modules no encontrado
    echo Instalando dependencias...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Fallo la instalacion de dependencias
        echo.
        pause
        exit /b 1
    )
)

echo Robot IP: %PEPPER_IP%
echo Usuario: %PEPPER_USER%
echo.
echo Abriendo terminales...
echo.

REM TERMINAL 1: py_toolkit
echo [1/4] Abriendo Terminal 1: py_toolkit...
start "TERMINAL 1: py_toolkit" "C:\Program Files\Git\bin\bash.exe" -c "ssh %PEPPER_USER%@%PEPPER_IP% 'cd %WORKSPACE_PATH% && source devel/setup.bash && roslaunch py_toolkit start_robot_toolkit_wlan.sh'; exec bash"

REM Esperar 5 segundos
timeout /t 5 /nobreak >nul

REM TERMINAL 2: manipulation_utilities
echo [2/4] Abriendo Terminal 2: manipulation_utilities...
start "TERMINAL 2: manipulation" "C:\Program Files\Git\bin\bash.exe" -c "ssh %PEPPER_USER%@%PEPPER_IP% 'cd %WORKSPACE_PATH% && source devel/setup.bash && rosrun manipulation_utilities manipulation_utilities'; exec bash"

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM TERMINAL 3: speech_utilities
echo [3/4] Abriendo Terminal 3: speech_utilities...
start "TERMINAL 3: speech" "C:\Program Files\Git\bin\bash.exe" -c "ssh %PEPPER_USER%@%PEPPER_IP% 'cd %WORKSPACE_PATH% && source devel/setup.bash && rosrun speech_utilities speech_utilities.py'; exec bash"

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM TERMINAL 4: navigation_utilities + perception_utilities
echo [4/4] Abriendo Terminal 4: navigation + perception...
start "TERMINAL 4: navigation+perception" "C:\Program Files\Git\bin\bash.exe" -c "ssh %PEPPER_USER%@%PEPPER_IP% 'cd %WORKSPACE_PATH% && source devel/setup.bash && rosrun navigation_utilities NavigationUtilities.py & rosrun perception_utilities PerceptionUtilities.py'; exec bash"

REM Esperar 10 segundos antes de iniciar el servidor web
timeout /t 10 /nobreak >nul

REM TERMINAL 5: Web Server
echo.
echo Iniciando servidor web...
start "Web Remote Controller" cmd /k "npm start"

echo.
echo ============================================
echo   Todos los servicios iniciados
echo ============================================
echo.
echo Espera 20-30 segundos y abre tu navegador en:
echo http://localhost:3000
echo.
echo Para detener: Cierra las ventanas de terminal
echo.
pause
