# Quick Reference Card

## 🚀 One-Command Setup

```bash
# macOS / Linux
bash .agents/setup.sh

# Windows
powershell -ExecutionPolicy Bypass -File .agents/setup.ps1
```

## 📦 Package Management

```bash
# Install dependency
npm install <package>          # or: bun add <package>

# Install dev dependency
npm install -D <package>       # or: bun add -d <package>

# Remove dependency
npm uninstall <package>        # or: bun remove <package>
```

## 🏃 Development

```bash
# Start dev server
npm run dev                    # or: bun run dev

# Build for production
npm run build                  # or: bun run build

# Run tests
npm test                       # or: bun test

# Run E2E tests
npx playwright test

# Lint
npm run lint
```

## 🗄️ Database

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name <name>

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## 🔧 Skills

```bash
# Update skills
cd .superpowers && git pull && cd ..
rm -rf .claude/skills && cp -r .superpowers/skills .claude/skills
```

## 📋 Common AI Agent Directories

| Agent | Directory | File |
|---|---|---|
| Claude Code | `.claude/skills/` | `AGENTS.md` |
| OpenAI Codex | `.codex/skills/` | `.codex/instructions.md` |
| Cursor | `.cursor/rules/` | `*.mdc` |
| Gemini | `.gemini/skills/` | `GEMINI.md` |
| Copilot | `.github/` | `copilot-instructions.md` |
| Windsurf | `.claude/skills/` | `CLAUDE.md` |

## 🎭 Playwright

```bash
# Run all tests
npx playwright test

# Run specific test
npx playwright test --grep "login"

# Run with UI
npx playwright test --ui

# Generate test
npx playwright codegen http://localhost:3000

# Show report
npx playwright show-report
```

## 🔍 Debugging Tips

1. **Systematic debugging skill** — read `.claude/skills/systematic-debugging/SKILL.md`
2. **Find root cause** — don't guess, trace
3. **Check logs** — server console, browser console, network tab
4. **Isolate** — reproduce the issue in minimal form
5. **Fix** — one change at a time, test after each
