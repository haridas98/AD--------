import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeSqliteDatabaseUrl } from './database-url.mjs';

test('keeps non-sqlite urls unchanged', () => {
  const url = 'postgresql://user:pass@localhost:5432/app';
  assert.equal(normalizeSqliteDatabaseUrl(url, 'C:/repo'), url);
});

test('keeps already absolute sqlite path unchanged', () => {
  const url = 'file:C:/repo/server/prisma/dev.db';
  assert.equal(normalizeSqliteDatabaseUrl(url, 'C:/repo'), url);
});

test('resolves relative sqlite path into absolute prisma-friendly path', () => {
  assert.equal(
    normalizeSqliteDatabaseUrl('file:./server/prisma/dev.db', 'C:/repo'),
    'file:C:/repo/server/prisma/dev.db',
  );
});
