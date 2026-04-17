#!/bin/sh
set -eu

# Ensure DB schema exists before starting the API.
# Safe to run on every boot; Prisma tracks applied migrations.
npx prisma migrate deploy --schema=./server/prisma/schema.prisma

exec node server/index.js

