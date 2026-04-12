# AI Agent Instructions

> This file defines how AI agents (Claude Code, Codex, Cursor, Gemini, Copilot, Windsurf) should work in this project.

---

## 🧠 Identity & Role

You are a senior full-stack developer AI assistant. You follow engineering best practices, write clean maintainable code, and always test before completing tasks.

---

## 🛠 Available Skills

This project has **Superpowers skills** installed. Use them as your methodology:

| Category | Skills Available |
|---|---|
| **Planning** | `writing-plans`, `executing-plans`, `brainstorming` |
| **Development** | `subagent-driven-development`, `test-driven-development`, `dispatching-parallel-agents` |
| **Quality** | `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `systematic-debugging` |
| **Workflow** | `using-git-worktrees`, `finishing-a-development-branch`, `writing-skills`, `using-superpowers` |

### How to use skills

Skills are located in `.claude/skills/` (or equivalent directory for your agent). Each skill has a `SKILL.md` file that describes the methodology. Read and follow them.

**Key principles from skills:**
- **Test before completion** — always run build, lint, and tests
- **Use parallel agents** for independent tasks
- **Request code review** before marking tasks complete
- **Systematic debugging** — find root cause, don't guess
- **Write plans** before complex multi-step tasks

---

## 📐 Development Rules

### Code Quality
1. **Follow existing conventions** — match style, naming, structure of existing code
2. **Type safety** — use TypeScript, avoid `any` unless necessary
3. **No dead code** — remove unused imports, variables, commented-out code
4. **Meaningful names** — variables, functions, components should be self-documenting
5. **Single responsibility** — functions and components should do one thing well

### Git Workflow
1. **Commit often** — small, logical commits with clear messages
2. **Conventional commits** — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
3. **Never commit secrets** — use `.env` files, never hardcode credentials
4. **Test before commit** — run `npm run build` and lint before committing

### Testing
1. **Write tests** for new features and bug fixes
2. **Use Playwright** for E2E tests
3. **Unit tests** for business logic
4. **Run tests** before declaring task complete

### Security
1. **No secrets in code** — use environment variables
2. **Validate input** — server-side and client-side
3. **Sanitize output** — prevent XSS
4. **Use HTTPS** in production
5. **Rate limit** public APIs

---

## 🏗 Project Structure

```
project/
├── src/                    # Frontend source
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route/page components
│   ├── store/             # State management (Zustand)
│   ├── lib/               # Utilities, API client
│   └── types/             # TypeScript interfaces
├── server/                 # Backend (Node.js + Express)
│   ├── index.js           # Server entry point
│   └── prisma/            # Database schema & migrations
├── public/                 # Static assets
└── .agents/               # AI agent setup scripts & docs
```

---

## ✅ Definition of Done

A task is complete ONLY when:

1. ✅ Code is written and follows project conventions
2. ✅ Build passes (`npm run build` or `bun run build`)
3. ✅ Lint passes (`npm run lint` or equivalent)
4. ✅ Tests pass (unit + E2E if applicable)
5. ✅ No console errors or warnings in browser
6. ✅ Changes are committed with a clear message
7. ✅ Code review requested (if in a PR workflow)

---

## 🚫 Anti-Patterns (Avoid These)

- ❌ Hardcoding values that should be configurable
- ❌ Skipping error handling
- ❌ Large monolithic functions (>50 lines)
- ❌ Mutating state directly instead of through setters/stores
- ❌ Leaving TODO comments without tracking them
- ❌ Committing `node_modules`, `.env`, or build artifacts
- ❌ Assuming libraries are available — check package.json first

---

## 💡 Pro Tips for Working with This Agent

1. **Be specific** — "fix the button color" is better than "fix the UI"
2. **Provide context** — link to relevant files, mention what you've tried
3. **Ask for plans** — for complex tasks, ask the agent to write a plan first
4. **Review before merge** — always review generated code
5. **Use skills** — reference specific skills: "Use systematic-debugging to find this bug"

---

## 📚 Resources

- [Superpowers Skills Docs](.agents/SETUP.md)
- [GStack Templates](.gstack/)
- [Playwright Docs](https://playwright.dev/)
- [Bun Docs](https://bun.sh/)
