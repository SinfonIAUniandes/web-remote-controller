@echo off
echo.
echo ============================================
echo   Iniciando Web Remote Controller
echo ============================================
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Verificar si npm esta instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm no esta instalado
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

echo Abriendo servidor web...
echo.
echo Espera 10-20 segundos y abre tu navegador en:
echo http://localhost:3000
echo.
echo Para detener el servidor: Cierra la ventana o presiona Ctrl+C
echo.

REM Ejecutar npm start directamente en esta ventana
npm start

pause
