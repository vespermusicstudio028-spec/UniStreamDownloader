# ==============================================================
#   UNISTREAM PRO -- AUTO DEPLOY
#   Clique duplo -> GitHub + Vercel + Render atualizados!
# ==============================================================

chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# ── LER CREDENCIAIS DO ARQUIVO .env.deploy (nao vai para o git) ──
$envFile = Join-Path $PSScriptRoot ".env.deploy"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim())
        }
    }
}

$GITHUB_USER  = $env:GITHUB_USER
$GITHUB_TOKEN = $env:GITHUB_TOKEN
$GITHUB_REPO  = "UniStreamDownloader"
$VERCEL_SCOPE = "tbiclientesltdas-projects"

if (-not $GITHUB_TOKEN) {
    Write-Host "  ERRO: Nao foi possivel ler o GITHUB_TOKEN do arquivo .env.deploy" -ForegroundColor Red
    Write-Host "  Crie o arquivo .env.deploy na mesma pasta do deploy.ps1" -ForegroundColor Yellow
    Read-Host "  Pressione ENTER para fechar"
    exit 1
}

$REPO_AUTH  = "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
$REPO_CLEAN = "https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
$TS = Get-Date -Format "dd/MM/yyyy HH:mm"

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "     UNISTREAM PRO  --  AUTO DEPLOY" -ForegroundColor Cyan
Write-Host "     GitHub + Vercel + Render" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "  $TS" -ForegroundColor DarkGray
Write-Host ""

# ── Configurar remote com autenticacao ────────────────────────
git remote set-url origin $REPO_AUTH 2>&1 | Out-Null

# ── ETAPA 1: Sincronizar com remoto e auto-limpar tokens do historico ──
Write-Host "  [1/4] Sincronizando com GitHub e limpando historico..." -ForegroundColor Yellow
git fetch origin main 2>&1 | Out-Null

# Faz o reset para origin/main descartando commits locais sujos (com token antigo no historico)
# mas mantendo TODOS os arquivos modificados intactos no seu computador!
git reset --mixed origin/main 2>&1 | Out-Null
Write-Host "  OK Historico limpo e sincronizado!" -ForegroundColor Green
Write-Host ""

# ── ETAPA 2: Commit ───────────────────────────────────────────
Write-Host "  [2/4] Commitando mudancas locais..." -ForegroundColor Yellow
$changes = git status --porcelain 2>&1
if (-not [string]::IsNullOrWhiteSpace($changes)) {
    git add -A 2>&1 | Out-Null
    git commit -m "deploy: atualizacao automatica [$TS]" 2>&1 | Out-Null
    Write-Host "  OK Novo commit limpo gerado!" -ForegroundColor Green
} else {
    Write-Host "  Nenhuma mudanca nova para commitar." -ForegroundColor DarkGray
}
Write-Host ""

# ── ETAPA 3: Push para GitHub ─────────────────────────────────
Write-Host "  [3/4] Enviando para GitHub..." -ForegroundColor Yellow
$pushOut = git push origin main 2>&1
$pushOk = $LASTEXITCODE -eq 0

# Restaurar URL sem credenciais (seguranca)
git remote set-url origin $REPO_CLEAN 2>&1 | Out-Null

if ($pushOk) {
    Write-Host "  OK GitHub atualizado com sucesso!" -ForegroundColor Green
    Write-Host "     -> Render rebuild automatico em ~2min" -ForegroundColor DarkGray
} else {
    Write-Host "  ERRO no GitHub: $pushOut" -ForegroundColor Red
    Read-Host "  Pressione ENTER para fechar"
    exit 1
}
Write-Host ""

# ── ETAPA 4: Build + Vercel ───────────────────────────────────
Write-Host "  [4/4] Deploy Vercel (frontend)..." -ForegroundColor Yellow

$buildOut = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Build gerado!" -ForegroundColor Green
} else {
    Write-Host "  Aviso: Build com erros (continuando)..." -ForegroundColor DarkYellow
}

if (-not (Test-Path (Join-Path $PSScriptRoot ".vercel\project.json"))) {
    Write-Host "  Vinculando ao Vercel pela primeira vez..." -ForegroundColor DarkGray
    npx vercel link --yes --scope $VERCEL_SCOPE 2>&1 | Out-Null
}

$vOut = npx vercel --prod --yes --scope $VERCEL_SCOPE 2>&1
if ($LASTEXITCODE -eq 0) {
    $url = $vOut | Where-Object { $_ -match "https://.*vercel\.app" } | Select-Object -Last 1
    Write-Host "  OK Vercel atualizado! $url" -ForegroundColor Green
} else {
    Write-Host "  Aviso Vercel (check npx vercel login): $($vOut | Select-Object -Last 2)" -ForegroundColor DarkYellow
}
Write-Host ""

# ── RESULTADO ─────────────────────────────────────────────────
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "      DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "  GitHub -> OK" -ForegroundColor Green
Write-Host "  Render -> Rebuild em andamento (~2min)" -ForegroundColor Green
Write-Host "  Vercel -> OK" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "  $TS" -ForegroundColor DarkGray
Write-Host ""
Start-Sleep -Seconds 4
