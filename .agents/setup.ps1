# AI Agent Development Environment Setup Script (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 AI Agent Development Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Helper functions
function Write-StepHeader($text) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📦 $text" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
}

function Write-Success($text) {
    Write-Host "✅ $text" -ForegroundColor Green
}

function Write-Info($text) {
    Write-Host "ℹ️  $text" -ForegroundColor DarkYellow
}

# 1. Check/Install Bun
Write-StepHeader "Step 1: Installing Bun"
$bunPath = "$env:USERPROFILE\.bun\bin\bun.exe"
if (Test-Path $bunPath) {
    Write-Success "Bun already installed: $(& $bunPath --version 2>$null)"
} else {
    Write-Info "Installing Bun..."
    powershell -c "irm bun.sh/install.ps1 | iex"
    $env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
    Write-Success "Bun installed: $(& $bunPath --version 2>$null)"
}
Write-Host ""

# 2. Clone Superpowers
Write-StepHeader "Step 2: Installing Superpowers Skills"
if (Test-Path ".superpowers") {
    Write-Success "Superpowers already cloned"
    Set-Location .superpowers; git pull; Set-Location ..
} else {
    git clone https://github.com/obra/superpowers.git .superpowers
}

# Copy skills to agent directories
$agentDirs = @(".claude/skills", ".codex/skills", ".cursor/rules", ".gemini/skills")
foreach ($dir in $agentDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Copy-Item -Path ".superpowers/skills/*" -Destination $dir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Success "Skills installed to .claude/skills/, .codex/skills/, .cursor/rules/, .gemini/skills/"
Write-Host ""

# 3. Install Playwright
Write-StepHeader "Step 3: Installing Playwright"
if (Test-Path $bunPath) {
    & $bunPath add -d playwright @playwright/test
    & $bunPath x playwright install chromium
} else {
    npm install -D playwright @playwright/test --legacy-peer-deps
    npx playwright install chromium
}
Write-Success "Playwright installed"
Write-Host ""

# 4. Clone GStack
Write-StepHeader "Step 4: Installing GStack"
if (Test-Path ".gstack") {
    Write-Success "GStack already present"
    Set-Location .gstack; git pull; Set-Location ..
} else {
    git clone https://github.com/garrytan/gstack.git .gstack
}
Write-Host ""

# 5. Create AGENTS.md
Write-StepHeader "Step 5: Setting up AI Agent Instructions"
if (-not (Test-Path "AGENTS.md")) {
    if (Test-Path ".agents/AGENTS.md") {
        Copy-Item ".agents/AGENTS.md" "AGENTS.md"
        Write-Success "AGENTS.md created"
    } else {
        Write-Info ".agents/AGENTS.md not found, skipping"
    }
} else {
    Write-Success "AGENTS.md already exists"
}
Write-Host ""

# 6. Create .env.example
Write-StepHeader "Step 6: Setting up environment template"
if (-not (Test-Path ".env.example") -and -not (Test-Path ".env")) {
    @'
# Server
PORT=8787
ADMIN_USER=admin
ADMIN_PASSWORD=change_me

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=change_me_to_random_string

# Frontend
VITE_API_BASE_URL=http://localhost:8787
'@ | Out-File -FilePath ".env.example" -Encoding utf8
    Write-Success ".env.example created"
} else {
    Write-Success "Environment file already exists"
}
Write-Host ""

# 7. Install project dependencies
Write-StepHeader "Step 7: Installing project dependencies"
if (Test-Path $bunPath -and (Test-Path "bun.lockb" -or Test-Path "bun.lock")) {
    & $bunPath install
} elseif (Test-Path "package.json") {
    npm install
}
Write-Success "Dependencies installed"
Write-Host ""

# 8. Database setup (if Prisma exists)
$prismaPath = $null
if (Test-Path "server/prisma/schema.prisma") {
    $prismaPath = "server"
} elseif (Test-Path "prisma/schema.prisma") {
    $prismaPath = "."
}

if ($prismaPath) {
    Write-StepHeader "Step 8: Setting up database"
    Set-Location $prismaPath
    npx prisma migrate dev --name init
    if (Test-Path "prisma/seed.ts") {
        npx tsx prisma/seed.ts
    }
    Set-Location ..
    Write-Success "Database ready"
    Write-Host ""
}

# Summary
Write-Host "`n🎉 =====================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Cyan
Write-Host "🎉 =====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Installed:" -ForegroundColor White
Write-Host "   • Bun runtime"
Write-Host "   • 14 Superpowers skills"
Write-Host "   • Playwright (Chromium)"
Write-Host "   • GStack templates"
Write-Host "   • AI agent instructions (AGENTS.md)"
Write-Host ""
Write-Host "📁 Directories:" -ForegroundColor White
Write-Host "   • .claude/skills/    — Claude Code skills"
Write-Host "   • .codex/skills/     — OpenAI Codex skills"
Write-Host "   • .cursor/rules/     — Cursor rules"
Write-Host "   • .gemini/skills/    — Gemini CLI skills"
Write-Host "   • .superpowers/      — Superpowers source"
Write-Host "   • .gstack/           — GStack templates"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor White
Write-Host "   1. Copy .env.example to .env and fill in values"
Write-Host "   2. Run 'npm run dev' or 'bun run dev' to start"
Write-Host "   3. Read AGENTS.md for AI agent guidelines"
Write-Host ""
