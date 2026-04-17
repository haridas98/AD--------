import { spawn } from 'node:child_process';

const PORT = 8791;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = 20000;
const POLL_INTERVAL_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  const start = Date.now();
  while (Date.now() - start < START_TIMEOUT_MS) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        const body = await res.json();
        if (body?.ok === true) return;
      }
    } catch {
      // Server may still be starting up.
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Server did not become healthy within ${START_TIMEOUT_MS}ms`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const child = spawn('node', ['server/index.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(PORT),
      DATABASE_URL: process.env.DATABASE_URL || 'file:./server/prisma/dev.db',
    },
  });

  let finished = false;
  const finalize = () => {
    if (!finished) {
      finished = true;
      if (!child.killed) child.kill();
    }
  };

  process.on('SIGINT', finalize);
  process.on('SIGTERM', finalize);

  try {
    await waitForHealth();

    const contentRes = await fetch(`${BASE_URL}/api/content`);
    assert(contentRes.ok, `GET /api/content failed with ${contentRes.status}`);
    const content = await contentRes.json();
    assert(Array.isArray(content.categories), 'categories must be an array');
    assert(Array.isArray(content.projects), 'projects must be an array');
    assert(Array.isArray(content.blogPosts), 'blogPosts must be an array');

    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid', password: 'invalid' }),
    });
    assert(badLoginRes.status === 401, `Invalid login must return 401, got ${badLoginRes.status}`);

    console.log('Smoke test passed.');
  } finally {
    finalize();
    await sleep(200);
  }
}

run().catch((err) => {
  console.error(`Smoke test failed: ${err.message}`);
  process.exit(1);
});

