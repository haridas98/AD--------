import fs from 'node:fs';
import path from 'node:path';

import { normalizeSqliteDatabaseUrl } from '../database-url.mjs';
import { generateProjectPageDraft } from '../lib/project-ai-draft.js';
import { generateGeminiProjectMetadata } from '../lib/gemini-provider.js';

function readLocalEnvFile() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return {};

  const values = {};
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) values[key] = value;
  }
  return values;
}

function getEnvValue(localEnv, key, fallback = '') {
  if (process.env[key] != null && process.env[key] !== '') return process.env[key];
  if (localEnv[key] != null && localEnv[key] !== '') return localEnv[key];
  return fallback;
}

function timestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

function backupSqliteDatabase(databaseUrl) {
  if (!databaseUrl?.startsWith('file:')) return '';

  const dbPath = path.resolve(databaseUrl.replace(/^file:/, ''));
  if (!fs.existsSync(dbPath)) return '';

  const backupPath = `${dbPath}.before-ai-content-reset-${timestamp()}.bak`;
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    allowLocalFallback: false,
    skipGemini: false,
    limit: 0,
    only: '',
    geminiDelayMs: Number(process.env.GEMINI_DELAY_MS || 0) || 0,
    instructions: '',
  };

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--allow-local-fallback') args.allowLocalFallback = true;
    else if (arg === '--skip-gemini') args.skipGemini = true;
    else if (arg.startsWith('--limit=')) args.limit = Number(arg.slice('--limit='.length)) || 0;
    else if (arg.startsWith('--only=')) args.only = arg.slice('--only='.length).trim();
    else if (arg.startsWith('--gemini-delay-ms=')) args.geminiDelayMs = Number(arg.slice('--gemini-delay-ms='.length)) || 0;
    else if (arg.startsWith('--instructions=')) args.instructions = arg.slice('--instructions='.length).trim();
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const localEnv = readLocalEnvFile();
  const rawDatabaseUrl = getEnvValue(localEnv, 'DATABASE_URL');

  if (rawDatabaseUrl) {
    process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(rawDatabaseUrl, process.cwd());
  }

  const databaseBackup = args.dryRun ? '' : backupSqliteDatabase(process.env.DATABASE_URL);
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const uploadsRoot = path.resolve('public/uploads');
  const gemini = {
    apiKey: args.skipGemini ? '' : getEnvValue(localEnv, 'GEMINI_API_KEY') || getEnvValue(localEnv, 'GOOGLE_AI_API_KEY'),
    model: getEnvValue(localEnv, 'GEMINI_MODEL', 'gemini-flash-latest'),
    imageLimit: Number(getEnvValue(localEnv, 'GEMINI_IMAGE_LIMIT', 8)) || 8,
  };

  const where = args.only
    ? {
        OR: [
          { id: args.only },
          { slug: args.only },
        ],
      }
    : {};

  let projects = await prisma.project.findMany({
    where,
    include: {
      category: true,
      assets: {
        where: {
          kind: 'image',
          status: 'active',
          includeInAi: true,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      },
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  if (args.limit > 0) projects = projects.slice(0, args.limit);

  let updated = 0;
  let geminiCount = 0;
  let fallbackCount = 0;
  let skipped = 0;

  for (const project of projects) {
    let metadata = {};
    let provider = 'local';

    if (gemini.apiKey && project.assets.length) {
      try {
        metadata = await generateGeminiProjectMetadata({
          ...gemini,
          project,
          assets: project.assets,
          uploadsRoot,
          instructions: args.instructions,
        });
        provider = 'gemini';
        geminiCount += 1;
        if (args.geminiDelayMs > 0) await sleep(args.geminiDelayMs);
      } catch (error) {
        fallbackCount += 1;
        console.warn(`[AI fallback] ${project.slug}: ${error.message}`);
      }
    } else {
      fallbackCount += 1;
    }

    if (provider !== 'gemini' && !args.allowLocalFallback) {
      skipped += 1;
      console.log(`[skipped] ${project.slug}: Gemini unavailable, ${project.assets.length} assets`);
      continue;
    }

    const draft = generateProjectPageDraft({
      project,
      assets: project.assets,
      instructions: args.instructions,
      metadata,
    });

    if (args.dryRun) {
      console.log(`[dry-run] ${project.slug}: ${draft.content.length} blocks via ${provider}, ${project.assets.length} assets`);
      continue;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        content: JSON.stringify(draft.content),
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        seoKeywords: draft.seoKeywords,
        updatedAt: new Date().toISOString(),
      },
    });

    updated += 1;
    console.log(`[updated] ${project.slug}: ${draft.content.length} blocks via ${provider}, ${project.assets.length} assets`);
  }

  console.log(`AI content reset finished: ${updated} projects updated, ${geminiCount} Gemini drafts, ${fallbackCount} local fallbacks, ${skipped} skipped.`);
  if (databaseBackup) console.log(`Backup: ${databaseBackup}`);

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
