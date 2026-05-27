# Configura codificação do console para UTF-8 (corrige acentuação)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "             UNISTREAM AUTO-DEPLOY SYSTEM" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Identificando alterações locais..." -ForegroundColor Yellow
git status -s
Write-Host ""

Write-Host "2. Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .
Write-Host "Arquivos adicionados com sucesso!" -ForegroundColor Green
Write-Host ""

$msg = Read-Host "Digite a descrição da alteração (ou ENTER para 'Atualização automática')"
if ([string]::IsNullOrWhiteSpace($msg)) {
    $msg = "Atualização automática"
}

Write-Host ""
Write-Host "3. Criando commit com a mensagem: '$msg'..." -ForegroundColor Yellow
git commit -m $msg

Write-Host ""
Write-Host "4. Enviando atualizações para o GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "   ✅ SUCESSO! O seu GitHub foi atualizado." -ForegroundColor Green
Write-Host ""
Write-Host "   🚀 O Render (backend) e o Vercel (frontend) já" -ForegroundColor Green
Write-Host "      iniciaram o deploy automático na nuvem!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Read-Host "Pressione ENTER para fechar..."
