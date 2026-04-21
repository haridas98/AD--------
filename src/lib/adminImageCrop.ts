import type { CoverCrop } from './imageTransforms';

type EditorSize = {
  width: number;
  height: number;
};

export function normalizeEditorCrop(crop?: Partial<CoverCrop>): Required<CoverCrop> {
  return {
    scale: Number(crop?.scale ?? 1),
    x: Number(crop?.x ?? 0),
    y: Number(crop?.y ?? 0),
  };
}

export function percentToEditorOffset(crop: Partial<CoverCrop> | undefined, size: EditorSize): Required<CoverCrop> {
  const next = normalizeEditorCrop(crop);

  return {
    scale: next.scale,
    x: Number(((next.x / 100) * size.width).toFixed(4)),
    y: Number(((next.y / 100) * size.height).toFixed(4)),
  };
}

export function editorOffsetToPercent(crop: Partial<CoverCrop> | undefined, size: EditorSize): Required<CoverCrop> {
  const next = normalizeEditorCrop(crop);
  const width = size.width || 1;
  const height = size.height || 1;

  return {
    scale: next.scale,
    x: Number(((next.x / width) * 100).toFixed(4)),
    y: Number(((next.y / height) * 100).toFixed(4)),
  };
}
