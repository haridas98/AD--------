import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cwd = process.cwd();
const requiredFiles = [
  'Dockerfile',
  'docker-compose.yml',
  'nginx.conf',
  'docker-entrypoint.sh',
  '.env',
];

function parseEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    map.set(key, value);
  }
  return map;
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

for (const rel of requiredFiles) {
  const full = path.join(cwd, rel);
  if (!fs.existsSync(full)) fail(`Missing required file: ${rel}`);
}

const dockerCheck = spawnSync('docker', ['compose', 'version'], { stdio: 'pipe', encoding: 'utf8' });
if (dockerCheck.status !== 0) fail('`docker compose` is not available.');

const envPath = path.join(cwd, '.env');
const env = parseEnv(envPath);

const adminUser = env.get('ADMIN_USER') || '';
const adminPassword = env.get('ADMIN_PASSWORD') || '';

if (!adminUser) fail('ADMIN_USER is missing in .env');
if (!adminPassword) fail('ADMIN_PASSWORD is missing in .env');

const bannedPasswords = new Set(['admin123', 'change_me_in_production', 'password', 'admin']);
if (bannedPasswords.has(adminPassword)) {
  fail('ADMIN_PASSWORD uses an unsafe default value. Set a strong value before deploy.');
}

console.log('Preflight passed.');
console.log('- Required files: OK');
console.log('- Docker Compose: OK');
console.log('- Admin credentials: OK');

