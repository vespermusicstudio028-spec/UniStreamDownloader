@echo off
chcp 65001 > nul
echo Configurando Vercel pela primeira vez...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-vercel.ps1"
