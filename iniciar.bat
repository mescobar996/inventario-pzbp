@echo off
title Inventario PZBP
echo ========================================
echo   Inventario PZBP - Iniciando servidor
echo ========================================
echo.
echo Abriendo aplicacion en http://localhost:5000
echo Presiona Ctrl+C para detener el servidor
echo.
start "" http://localhost:5000
node server/index.js
pause
