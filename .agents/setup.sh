#!/usr/bin/env bash
set -e

echo "🚀 AI Agent Development Environment Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
OS="$(uname -s)"
echo "📱 OS detected: $OS"
echo ""

# 1. Check/Install Bun
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 1: Installing Bun"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v bun &> /dev/null; then
    echo -e "${GREEN}✅ Bun already installed: $(bun --version)${NC}"
else
    echo -e "${YELLOW}⏳ Installing Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    echo -e "${GREEN}✅ Bun installed: $(bun --version)${NC}"
fi
echo ""

# 2. Clone Superpowers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🦸 Step 2: Installing Superpowers Skills"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d ".superpowers" ]; then
    echo -e "${GREEN}✅ Superpowers already cloned${NC}"
    cd .superpowers && git pull && cd ..
else
    git clone https://github.com/obra/superpowers.git .superpowers
fi

# Copy skills to agent directories
for dir in .claude .codex .cursor/rules .gemini; do
    mkdir -p "$dir/skills"
    cp -r .superpowers/skills/* "$dir/skills/" 2>/dev/null || true
done

# Copy to Cursor rules format
if [ -d ".superpowers/skills" ]; then
    for skill in .superpowers/skills/*/; do
        skill_name=$(basename "$skill")
        if [ -f "$skill/SKILL.md" ]; then
            cp "$skill/SKILL.md" ".cursor/rules/${skill_name}.mdc" 2>/dev/null || true
        fi
    done
fi

echo -e "${GREEN}✅ Skills installed to .claude/skills/, .codex/skills/, .cursor/rules/, .gemini/skills/${NC}"
echo ""

# 3. Install Playwright
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎭 Step 3: Installing Playwright"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v bun &> /dev/null; then
    bun add -d playwright @playwright/test
    bun x playwright install chromium
else
    npm install -D playwright @playwright/test
    npx playwright install chromium
fi
echo -e "${GREEN}✅ Playwright installed${NC}"
echo ""

# 4. Clone GStack
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Step 4: Installing GStack"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d ".gstack" ]; then
    echo -e "${GREEN}✅ GStack already present${NC}"
    cd .gstack && git pull && cd ..
else
    git clone https://github.com/garrytan/gstack.git .gstack
fi
echo ""

# 5. Create AGENTS.md
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Step 5: Setting up AI Agent Instructions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ! -f "AGENTS.md" ]; then
    if [ -f ".agents/AGENTS.md" ]; then
        cp .agents/AGENTS.md AGENTS.md
        echo -e "${GREEN}✅ AGENTS.md created${NC}"
    else
        echo -e "${YELLOW}⚠️  .agents/AGENTS.md not found, skipping${NC}"
    fi
else
    echo -e "${GREEN}✅ AGENTS.md already exists${NC}"
fi
echo ""

# 6. Create .env.example
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Step 6: Setting up environment template"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ! -f ".env.example" ] && [ ! -f ".env" ]; then
    cat > .env.example << 'EOF'
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
EOF
    echo -e "${GREEN}✅ .env.example created${NC}"
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi
echo ""

# 7. Install project dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 7: Installing project dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v bun &> /dev/null && [ -f "bun.lockb" -o -f "bun.lock" ]; then
    bun install
elif [ -f "package.json" ]; then
    npm install
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# 8. Database setup (if Prisma exists)
if [ -f "prisma/schema.prisma" ] || [ -f "server/prisma/schema.prisma" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🗄️  Step 8: Setting up database"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    PRISMA_DIR="."
    [ -f "server/prisma/schema.prisma" ] && PRISMA_DIR="server"
    cd "$PRISMA_DIR"
    npx prisma migrate dev --name init
    if [ -f "prisma/seed.ts" ]; then
        npx tsx prisma/seed.ts
    fi
    cd ..
    echo -e "${GREEN}✅ Database ready${NC}"
    echo ""
fi

# Summary
echo ""
echo "🎉 ====================================="
echo "🎉 Setup Complete!"
echo "🎉 ====================================="
echo ""
echo "📦 Installed:"
echo "   • Bun runtime"
echo "   • 14 Superpowers skills"
echo "   • Playwright (Chromium)"
echo "   • GStack templates"
echo "   • AI agent instructions (AGENTS.md)"
echo ""
echo "📁 Directories:"
echo "   • .claude/skills/    — Claude Code skills"
echo "   • .codex/skills/     — OpenAI Codex skills"
echo "   • .cursor/rules/     — Cursor rules"
echo "   • .gemini/skills/    — Gemini CLI skills"
echo "   • .superpowers/      — Superpowers source"
echo "   • .gstack/           — GStack templates"
echo ""
echo "🚀 Next steps:"
echo "   1. Copy .env.example to .env and fill in values"
echo "   2. Run 'npm run dev' or 'bun run dev' to start"
echo "   3. Read AGENTS.md for AI agent guidelines"
echo ""
