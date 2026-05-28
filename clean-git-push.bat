@echo off
chcp 65001 > nul
echo ====================================================
echo CORRIGINDO HISTÓRICO DO GIT (REMOVENDO TOKEN)
echo ====================================================
echo.

echo 1. Resetando histórico local para o ponto limpo do GitHub...
git reset --mixed origin/main

echo.
echo 2. Adicionando arquivos limpos...
git add -A

echo.
echo 3. Criando novo commit limpo...
git commit -m "chore: deploy automatico e otimizacoes de performance"

echo.
echo 4. Enviando para o GitHub...
git push origin main

echo.
echo ====================================================
echo Concluído! Agora você pode usar o deploy.bat normalmente.
echo ====================================================
pause
