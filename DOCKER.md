# Docker — Инструкция по использованию

> **Document Version:** 1.0  
> **Last Updated:** April 2026

---

## 📋 Содержание

1. [Быстрый старт](#-быстрый-старт)
2. [Как работает Docker в этом проекте](#-как-работает-docker-в-этом-проекте)
3. [Режим разработки](#-режим-разработки)
4. [Режим production](#-режим-production)
5. [Частые вопросы (FAQ)]#-частые-вопросы-faq)
6. [Команды Docker](#-команды-docker)
7. [Структура файлов](#-структура-файлов)
8. [Troubleshooting](#-troubleshooting)

---

## 🚀 Быстрый старт

### Разработка (Development)

```bash
# 1. Скопируй .env.example в .env
cp .env.example .env

# 2. Запусти контейнеры
npm run docker:dev

# Приложение доступно:
# Фронтенд: http://localhost:3000
# Бэкенд:   http://localhost:8787
```

### Production

```bash
# 1. Настрой .env файл
nano .env

# 2. Собери и запусти
npm run docker:prod

# Приложение доступно:
# http://localhost:8787
```

---

## 🧠 Как работает Docker в этом проекте

### Ответ на главный вопрос: "Нужно ли пересобирать Docker при изменениях?"

**Зависит от режима:**

#### 🔧 Режим разработки (dev profile)
```
✅ НЕ НУЖНО пересобирать при изменении кода!
```

Почему? Потому что код монтируется через **volume**:
```yaml
volumes:
  - .:/app           # Твой код → контейнер
  - /app/node_modules  # Исключаем node_modules
```

**Что происходит:**
- Изменил `.tsx` файл → Vite автоматически обновляет (hot reload)
- Изменил `server/index.js` → Node.js видит изменения
- Изменил `package.json` → Перезапусти контейнер (`docker compose restart`)

#### 🏭 Режим production (prod profile)
```
⚠️ НУЖНО пересобирать при изменении кода!
```

Почему? Production образ включает **собранный код** (dist/):
```dockerfile
RUN npm run build  # Фронтенд собирается в образ
COPY --from=frontend-builder /app/dist ./public
```

**Когда пересобирать:**
- Изменил фронтенд код → `npm run docker:prod` (авто-пересборка)
- Изменил бэкенд код → `npm run docker:prod` (авто-пересборка)
- Изменил `.env` → `docker compose restart` (без пересборки)

---

## 🛠 Режим разработки

### Запуск

```bash
# Запуск с volume mounts (код синхронизируется)
npm run docker:dev
# или
docker compose --profile dev up
```

### Как работает hot reload

```
┌─────────────────────────────────────────┐
│         Твой компьютер (host)           │
│  C:\Projects\AD — копия\                │
│  └── src/ ← меняешь код здесь          │
│  └── server/ ← меняешь код здесь       │
└──────────────┬──────────────────────────┘
               │ volume mount (синхронизация)
               ▼
┌─────────────────────────────────────────┐
│         Docker Container                │
│  /app/src/ ← видит изменения            │
│  /app/server/ ← видит изменения         │
│                                         │
│  Vite → hot reload (мгновенно)         │
│  Node.js → file watcher                │
└─────────────────────────────────────────┘
```

###Workflow разработки

```bash
# 1. Запусти контейнеры
npm run docker:dev

# 2. Открой браузер
http://localhost:3000

# 3. Редактируй код в любимом редакторе
# Изменения применяются автоматически!

# 4. Останови когда закончишь
npm run docker:down
```

### Если изменил package.json

```bash
# Перезапусти контейнер (перестроит node_modules)
docker compose --profile dev down
npm run docker:dev
```

---

## 🏭 Режим Production

### Запуск

```bash
# Сборка + запуск
npm run docker:prod
# или
docker compose --profile prod up --build
```

### Как работает production образ

```dockerfile
# Этап 1: Сборка фронтенда
FROM node:20-alpine AS frontend-builder
RUN npm ci
RUN npm run build  # → dist/

# Этап 2: Production сервер
FROM node:20-alpine AS production
COPY server/ ./server/
COPY --from=frontend-builder /app/dist ./public  # ← собранный фронтенд
CMD ["node", "server/index.js"]
```

**Результат:**
- ✅ Оптимизированный образ (только production зависимости)
- ✅ Минимальный размер (Alpine Linux)
- ✅ Безопасность (не-root пользователь)
- ✅ Health check для мониторинга

### Workflow production

```bash
# 1. Внес изменения в код
# 2. Пересобери и запусти
npm run docker:prod

# 3. Проверь в браузере
http://localhost:8787

# 4. Готово к деплою!
```

### Push в Docker Registry (опционально)

```bash
# Собираем образ с тегом
docker build -t yourusername/alexandradiz:latest .

# Пушим в Docker Hub
docker push yourusername/alexandradiz:latest

# Или в GitHub Container Registry
docker tag alexandradiz ghcr.io/yourusername/alexandradiz:latest
docker push ghcr.io/yourusername/alexandradiz:latest
```

---

## ❓ Частые вопросы (FAQ)

### Q: Я изменил файл, но ничего не произошло. Почему?

**A:** 
- Для **разработки**: Vite должен обновлять автоматически. Проверь консоль на ошибки.
- Для **production**: нужно пересобрать образ → `npm run docker:prod`

### Q: Где хранятся данные базы данных?

**A:** В Docker volumes (сохраняются между перезапусками):
```bash
# Посмотри volumes
docker volume ls | grep ad-

# Данные SQLite: sqlite_data
# Загруженные файлы: uploads_data
```

### Q: Как сбросить базу данных?

```bash
# Останови и удали volumes
npm run docker:clean

# Или конкретный volume
docker volume rm ad_-_копия_sqlite_data
```

### Q: Могу ли я использовать PostgreSQL вместо SQLite?

**A:** Да! В `docker-compose.yml` есть закомментированный PostgreSQL сервис:
1. Раскомментируй `database` service
2. Обнови `DATABASE_URL` в `.env`
3. Обнови `server/prisma/schema.prisma` → `provider = "postgresql"`

### Q: Как посмотреть логи?

```bash
# Все логи
npm run docker:logs

# Логи конкретного сервиса
docker compose logs -f dev-server
docker compose logs -f prod-server
```

### Q: Как войти в контейнер?

```bash
# Development контейнер
docker compose run --rm dev-server sh

# Production контейнер
docker compose run --rm prod-server sh
```

### Q: Почему production образ такой большой?

**A:** Multi-stage build оптимизирует размер:
- Builder stage: ~500MB (все devDependencies)
- Production stage: ~150MB (только production dependencies)

---

## 🎮 Команды Docker

### npm скрипты (рекомендуется)

| Команда | Описание |
|---------|----------|
| `npm run docker:dev` | Запуск разработки |
| `npm run docker:dev:build` | Пересборка + запуск разработки |
| `npm run docker:prod` | Сборка + запуск production |
| `npm run docker:down` | Остановка всех контейнеров |
| `npm run docker:clean` | Остановка + удаление volumes |
| `npm run docker:logs` | Просмотр логов |
| `npm run docker:shell` | Вход в контейнер |

### Docker Compose команды (альтернатива)

| Команда | Описание |
|---------|----------|
| `docker compose --profile dev up` | Запуск разработки |
| `docker compose --profile dev up --build` | Пересборка + запуск |
| `docker compose --profile prod up --build` | Production сборка + запуск |
| `docker compose --profile dev --profile prod down` | Остановка |
| `docker compose --profile dev --profile prod down -v` | Остановка + volumes |
| `docker compose logs -f` | Логи |
| `docker compose exec prod-server sh` | Вход в running контейнер |

### Docker команды (низкоуровневые)

| Команда | Описание |
|---------|----------|
| `docker build -t ad-app .` | Собрать образ |
| `docker run -p 8787:8787 ad-app` | Запустить контейнер |
| `docker ps` | Список running контейнеров |
| `docker images` | Список образов |
| `docker volume ls` | Список volumes |
| `docker system prune` | Очистка unused ресурсов |

---

## 📁 Структура файлов

```
project/
├── Dockerfile              # Production сборка
├── docker-compose.yml      # Dev + Prod конфигурация
├── .dockerignore           # Исключения из Docker build
├── .env.example            # Шаблон переменных окружения
├── .env                    # Твои переменные (НЕ коммить!)
│
├── server/
│   ├── index.js            # Express сервер
│   └── prisma/
│       └── schema.prisma   # Схема БД (SQLite)
│
├── src/                    # React фронтенд
│   ├── components/
│   ├── pages/
│   └── ...
│
└── public/                 # Статические файлы
    └── uploads/            # Загруженные изображения (volume)
```

---

## 🔧 Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Посмотри логи
docker compose logs dev-server

# Частые причины:
# 1. Порт уже занят → измени PORT в .env
# 2. Ошибка в package.json → проверь синтаксис
# 3. Нет .env файла → cp .env.example .env
```

### Проблема: Изменения кода не применяются

```bash
# Для разработки:
# 1. Проверь что volume примонтирован
docker inspect ad-dev-server | grep Mounts -A 20

# 2. Перезапусти контейнер
docker compose restart dev-server

# 3. Полная пересборка
docker compose --profile dev down
npm run docker:dev:build
```

### Проблема: SQLite база не сохраняется

```bash
# Проверь volumes
docker volume ls | grep sqlite

# Восстанови из backup
docker volume create sqlite_data_backup
docker run --rm -v sqlite_data:/source -v sqlite_data_backup:/target alpine sh -c "cp -r /source/* /target/"
```

### Проблема: Нет доступа к uploads/

```bash
# Проверь права
docker compose exec prod-server ls -la /app/public/uploads

# Исправь права (в container)
docker compose exec prod-server chown -R nodejs:nodejs /app/public/uploads
```

---

## 🎯 Best Practices

### Разработка

1. ✅ Используй `docker:dev` для daily work
2. ✅ Редактируй код в host machine (не в container)
3. ✅ Коммить изменения в Git (не в Docker image)
4. ✅ Используй `.env` для secrets

### Production

1. ✅ Всегда тестируй локально перед деплоем
2. ✅ Используй конкретные теги образов (не `latest`)
3. ✅ Храни `.env` в secrets manager
4. ✅ Регулярно обновляй базовый образ (`node:20-alpine`)

### Git + Docker

```bash
# .gitignore должен включать:
.env
node_modules/
dist/
public/uploads/

# Но НЕ включай:
.env.example  ← коммить
Dockerfile    ← коммить
docker-compose.yml ← коммить
```

---

## 📚 Ресурсы

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Prisma + Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/docker)

---

> 💡 **Pro Tip:** Для production деплоя рассмотри GitHub Actions для автоматической сборки и push образов в Docker Hub/GHCR.

*This document is a living guide. Update as needed.* 🐳✨
