#!/bin/sh
set -eu

# Docker stores the runtime SQLite DB in /data. On a fresh volume, bootstrap it
# from the DB bundled into the image so production starts with migrated content.
if [ "${DATABASE_URL#file:}" != "$DATABASE_URL" ]; then
  DATA_DB_PATH="${DATABASE_URL#file:}"
  DATA_DB_PATH="${DATA_DB_PATH%%\?*}"
  BUNDLED_DB_PATH="./server/prisma/dev.db"

  if [ "$DATA_DB_PATH" != "$BUNDLED_DB_PATH" ] && [ -f "$BUNDLED_DB_PATH" ] && [ ! -s "$DATA_DB_PATH" ]; then
    mkdir -p "$(dirname "$DATA_DB_PATH")"
    cp "$BUNDLED_DB_PATH" "$DATA_DB_PATH"
  fi
fi

# Ensure DB schema exists before starting the API.
# Safe to run on every boot; Prisma tracks applied migrations.
npx prisma migrate deploy --schema=./server/prisma/schema.prisma

exec node server/index.js
