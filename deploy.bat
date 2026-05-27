@echo off
:: Configura codificação do terminal para UTF-8 (corrige acentos no Windows)
chcp 65001 > nul

echo ====================================================
echo             UNISTREAM AUTO-DEPLOY SYSTEM
echo ====================================================
echo.
echo 1. Identificando alterações locais...
git status -s
echo.

echo 2. Adicionando arquivos ao Git...
git add .
echo Arquivos adicionados!

echo.
set /p msg="Digite a descrição da alteração (ou ENTER para 'Atualização automática'): "
if "%msg%"=="" set msg=Atualização automática

echo.
echo 3. Criando commit com a mensagem: "%msg%"
git commit -m "%msg%"

echo.
echo 4. Enviando atualizações para o GitHub...
git push origin main

echo.
echo ====================================================
echo   ✅ SUCESSO! O seu GitHub foi atualizado.
echo.
echo   🚀 O Render (backend) e o Vercel (frontend) já 
echo      iniciaram o deploy automático na nuvem!
echo ====================================================
echo.
pause
