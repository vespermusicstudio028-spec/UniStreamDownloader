# ============================================================
#     UNISTREAM PRO -- CONFIGURACAO INICIAL DO VERCEL
#     Execute UMA VEZ para vincular o projeto
# ============================================================

chcp 65001 | Out-Null
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Ler credenciais do .env.deploy (nao vai para o github)
$envFile = Join-Path $PSScriptRoot ".env.deploy"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim())
        }
    }
}
$GITHUB_TOKEN = $env:GITHUB_TOKEN
$GITHUB_USER  = $env:GITHUB_USER
$GITHUB_REPO  = "https://github.com/vespermusicstudio028-spec/UniStreamDownloader.git"

Clear-Host
Write-Host ""
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host "     UNISTREAM PRO -- CONFIGURACAO INICIAL" -ForegroundColor Cyan
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Este script vai:" -ForegroundColor Yellow
Write-Host "  1. Enviar arquivos para o GitHub" -ForegroundColor White
Write-Host "  2. Vincular este projeto ao Vercel" -ForegroundColor White
Write-Host "  3. Fazer o primeiro deploy no Vercel" -ForegroundColor White
Write-Host ""

# ETAPA 1 - Git push
Write-Host "  [1/3] Enviando para GitHub..." -ForegroundColor Yellow
$authUrl = "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/vespermusicstudio028-spec/UniStreamDownloader.git"
git remote set-url origin $authUrl | Out-Null
git add -A 2>&1 | Out-Null
git commit -m "chore: setup inicial vercel + deploy scripts" 2>&1 | Out-Null
git push origin main 2>&1
git remote set-url origin $GITHUB_REPO | Out-Null
Write-Host "  OK GitHub atualizado!" -ForegroundColor Green
Write-Host ""

# ETAPA 2 - Vincular ao Vercel
Write-Host "  [2/3] Vinculando ao Vercel..." -ForegroundColor Yellow
Write-Host "  (O Vercel CLI pode fazer perguntas. Responda conforme aparecer.)" -ForegroundColor DarkGray
Write-Host ""
npx vercel link --scope tbiclientesltdas-projects
Write-Host ""

if (Test-Path ".vercel\project.json") {
    Write-Host "  OK Projeto vinculado ao Vercel!" -ForegroundColor Green
} else {
    Write-Host "  Aviso: Vinculacao pode nao ter completado." -ForegroundColor DarkYellow
    Write-Host "  Tente rodar: npx vercel link" -ForegroundColor DarkYellow
}
Write-Host ""

# ETAPA 3 - Primeiro deploy
Write-Host "  [3/3] Primeiro deploy no Vercel..." -ForegroundColor Yellow
npm run build
npx vercel --prod --yes --scope tbiclientesltdas-projects

Write-Host ""
Write-Host "  =============================================" -ForegroundColor Green
Write-Host "       CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "  =============================================" -ForegroundColor Green
Write-Host "  Agora use deploy.bat para futuros deploys." -ForegroundColor White
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "  Pressione ENTER para fechar"
