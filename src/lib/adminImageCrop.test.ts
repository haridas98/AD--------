import test from 'node:test';
import assert from 'node:assert/strict';

import {
  editorOffsetToPercent,
  normalizeEditorCrop,
  percentToEditorOffset,
} from './adminImageCrop';

test('normalizeEditorCrop fills missing values', () => {
  assert.deepEqual(normalizeEditorCrop(), { scale: 1, x: 0, y: 0 });
  assert.deepEqual(normalizeEditorCrop({ scale: 1.35 }), { scale: 1.35, x: 0, y: 0 });
});

test('percentToEditorOffset converts stored crop into editor coordinates', () => {
  assert.deepEqual(
    percentToEditorOffset({ scale: 1.2, x: 12.5, y: -8 }, { width: 800, height: 500 }),
    { scale: 1.2, x: 100, y: -40 },
  );
});

test('editorOffsetToPercent converts editor coordinates back to stored crop', () => {
  assert.deepEqual(
    editorOffsetToPercent({ scale: 1.2, x: 100, y: -40 }, { width: 800, height: 500 }),
    { scale: 1.2, x: 12.5, y: -8 },
  );
});

test('roundtrip keeps crop stable', () => {
  const initial = { scale: 1.65, x: -14.25, y: 9.5 };
  const editor = percentToEditorOffset(initial, { width: 640, height: 360 });
  const restored = editorOffsetToPercent(editor, { width: 640, height: 360 });

  assert.deepEqual(restored, initial);
});
