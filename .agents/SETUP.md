# 🚀 AI Agent Development Environment — Universal Setup

> Автоматическая настройка полного окружения для AI-ассистированной разработки.
> Работает с Claude Code, Codex, Cursor, Gemini, Windsurf, GitHub Copilot.

---

## 📦 Что включено

| Компонент | Версия | Назначение |
|---|---|---|
| **Bun** | latest | Быстрый runtime, пакетный менеджер |
| **Playwright** | latest | E2E тестирование, автоматизация |
| **Superpowers Skills** | latest | 14 skill'ов для AI-агентов |
| **Code Review** | — | Автоматический ревью кода |
| **Frontend Design** | — | Паттерны UI/UX |
| **GStack** | latest | Full-stack boilerplate и утилиты |

---

## ⚡ Быстрый старт (1 команда)

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/main/scripts/install.sh | bash

# Windows PowerShell
powershell -c "irm https://raw.githubusercontent.com/obra/superpowers/main/scripts/install.ps1 | iex"
```

Или используйте локальный скрипт из этого репозитория:

```bash
# macOS / Linux
bash .agents/setup.sh

# Windows
powershell -ExecutionPolicy Bypass -File .agents/setup.ps1
```

---

## 🔧 Ручная установка по шагам

### 1. Bun (runtime + пакетный менеджер)

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 2. Superpowers Skills

```bash
git clone https://github.com/obra/superpowers.git .superpowers

# Скопировать skills в проект
cp -r .superpowers/skills .claude/skills/          # Claude Code
cp -r .superpowers/skills .codex/skills/           # OpenAI Codex
cp -r .superpowers/skills .cursor/rules/           # Cursor
cp -r .superpowers/skills .gemini/skills/          # Gemini CLI
```

### 3. Playwright (E2E тесты)

```bash
# Через npm
npm install -D playwright @playwright/test
npx playwright install chromium

# Через Bun
bun add -d playwright @playwright/test
bun x playwright install chromium
```

### 4. GStack (шаблоны)

```bash
git clone https://github.com/garrytan/gstack.git .gstack
```

---

## 📋 Список Skills

| Skill | Описание |
|---|---|
| `brainstorming` | Визуальный брейнсторминг с HTML-компаньоном |
| `dispatching-parallel-agents` | Параллельный запуск нескольких агентов |
| `executing-plans` | Пошаговое выполнение планов разработки |
| `finishing-a-development-branch` | Завершение ветки: тесты, коммит, push |
| `receiving-code-review` | Как получать и применять ревью |
| `requesting-code-review` | Как запрашивать ревью кода |
| `subagent-driven-development` | Разработка через субагентов |
| `systematic-debugging` | Систематическая отладка, root cause analysis |
| `test-driven-development` | TDD workflow |
| `using-git-worktrees` | Параллельная работа с несколькими ветками |
| `using-superpowers` | Как пользоваться всеми skills |
| `verification-before-completion` | Проверка перед завершением задачи |
| `writing-plans` | Написание планов разработки |
| `writing-skills` | Как писать новые skills для агентов |

---

## 🤖 Интеграция с AI агентами

### Claude Code (Anthropic)
```bash
# Skills автоматически подхватываются из .claude/skills/
# AGENTS.md в корне проекта задаёт правила поведения
cp .agents/AGENTS.md AGENTS.md
```

### OpenAI Codex
```bash
# Codex читает .codex/instructions.md
cp .agents/AGENTS.md .codex/instructions.md
```

### Cursor
```bash
# Cursor использует .cursor/rules/
cp .agents/AGENTS.md .cursor/rules/agents.mdc
```

### Gemini CLI
```bash
# Gemini читает GEMINI.md
cp .agents/AGENTS.md GEMINI.md
```

### GitHub Copilot
```bash
# Copilot читает .github/copilot-instructions.md
mkdir -p .github
cp .agents/AGENTS.md .github/copilot-instructions.md
```

### Windsurf / Cline
```bash
# Windsurf читает CLAUDE.md
cp .agents/AGENTS.md CLAUDE.md
```

---

## 📁 Структура проекта

```
project/
├── AGENTS.md                 # ← Главная инструкция для AI агента
├── .agents/
│   ├── AGENTS.md             # Универсальный шаблон AGENTS.md
│   ├── setup.sh              # Скрипт установки (Unix)
│   ├── setup.ps1             # Скрипт установки (Windows)
│   └── skills/               # (опционально) копия всех skills
├── .claude/
│   └── skills/               # Skills для Claude Code
├── .codex/                   # Skills для OpenAI Codex
├── .cursor/
│   └── rules/                # Rules для Cursor
├── .github/
│   └── copilot-instructions.md  # Для GitHub Copilot
├── GEMINI.md                 # Для Gemini CLI
├── CLAUDE.md                 # Для Windsurf/Cline
├── .superpowers/             # Оригинал superpowers repo
└── .gstack/                  # GStack шаблоны
```

---

## 🔄 Обновление

```bash
# Обновить superpowers skills
cd .superpowers && git pull && cd ..
rm -rf .claude/skills && cp -r .superpowers/skills .claude/skills

# Обновить Bun
bun upgrade

# Обновить Playwright
npx playwright install
```

---

## 🐛 Troubleshooting

### Bun не найден после установки
```bash
# Перезапустите терминал или:
export PATH="$HOME/.bun/bin:$PATH"  # macOS/Linux
# Windows: добавьте C:\Users\<User>\.bun\bin в PATH
```

### Playwright не запускается
```bash
npx playwright install --with-deps
```

### Skills не подхватываются агентом
Убедитесь что:
1. Файлы лежат в правильной директории (`.claude/skills/`, `.codex/skills/`, etc.)
2. Каждый skill имеет `SKILL.md` в корне своей папки
3. AGENTS.md в корне проекта ссылается на skills

---

## 📝 Лицензии

- [obra/superpowers](https://github.com/obra/superpowers) — MIT
- [garrytan/gstack](https://github.com/garrytan/gstack) — MIT
- Playwright — Apache 2.0
- Bun — MIT
