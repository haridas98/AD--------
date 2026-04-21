import path from 'path';

export function normalizeSqliteDatabaseUrl(url, cwd = process.cwd()) {
  if (!url || !String(url).startsWith('file:')) return url;

  const rawPath = String(url).slice(5);
  if (!rawPath.startsWith('.')) return url;

  const absolutePath = path.resolve(cwd, rawPath).replace(/\\/g, '/');
  return `file:${absolutePath}`;
}
