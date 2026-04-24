import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ensureProjectAssetDirectories,
  getProjectAssetPublicUrl,
  getProjectAssetStoragePath,
  normalizeProjectAssetFilename,
} from './lib/project-assets.js';

test('normalizeProjectAssetFilename preserves extension and normalizes stem', () => {
  assert.equal(
    normalizeProjectAssetFilename('Belmond Kitchen View 01.JPG'),
    'belmond-kitchen-view-01.jpg',
  );
});

test('getProjectAssetStoragePath builds project-scoped relative path', () => {
  assert.equal(
    getProjectAssetStoragePath('gothic-guestroom', 'image', 'hero-shot.jpg'),
    'projects/gothic-guestroom/images/original/hero-shot.jpg',
  );
});

test('getProjectAssetPublicUrl builds public uploads url', () => {
  assert.equal(
    getProjectAssetPublicUrl('gothic-guestroom', 'image', 'hero-shot.jpg'),
    '/uploads/projects/gothic-guestroom/images/original/hero-shot.jpg',
  );
});

test('ensureProjectAssetDirectories creates image and video directories', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-project-assets-'));

  try {
    const dirs = ensureProjectAssetDirectories('gothic-guestroom', tempRoot);

    assert.equal(fs.existsSync(dirs.projectRoot), true);
    assert.equal(fs.existsSync(dirs.imageOriginalDir), true);
    assert.equal(fs.existsSync(dirs.imageDerivedDir), true);
    assert.equal(fs.existsSync(dirs.videoOriginalDir), true);
    assert.equal(fs.existsSync(dirs.importsDir), true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
