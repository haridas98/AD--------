const DEFAULT_MODEL = 'gemini-flash-latest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeModel(model) {
  return cleanText(model || DEFAULT_MODEL).replace(/^models\//, '');
}

function parseJsonText(text) {
  const raw = cleanText(text)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const direct = JSON.parse(raw);
  if (!direct || typeof direct !== 'object' || Array.isArray(direct)) {
    throw new Error('Gemini returned invalid JSON shape');
  }

  return direct;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaError(error) {
  return /quota|rate-limit|rate limit|429/i.test(error?.message || '');
}

function isLocationError(error) {
  return /location is not supported/i.test(error?.message || '');
}

function categoryLabel(project) {
  return project?.category?.name || project?.categoryName || 'interior design';
}

function projectLocation(project) {
  return project?.cityName || 'California';
}

function compactAssetList(assets = []) {
  const seen = new Set();

  return assets
    .filter((asset) => asset.kind === 'image' && asset.status === 'active' && asset.includeInAi !== false)
    .filter((asset) => {
      const key = asset.checksum || asset.publicUrl || asset.storagePath || asset.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12)
    .map((asset, index) => ({
      index: index + 1,
      alt: asset.altText || '',
      file: asset.fileName || asset.originalName || '',
      width: asset.width || null,
      height: asset.height || null,
      orientation: asset.width && asset.height
        ? asset.width > asset.height ? 'landscape' : asset.width < asset.height ? 'portrait' : 'square'
        : 'unknown',
    }));
}

function resolveLocalAssetPath(asset, uploadsRoot) {
  const root = path.resolve(uploadsRoot || 'public/uploads');
  const candidates = [
    asset.sourcePath && !/^https?:\/\//i.test(asset.sourcePath) ? asset.sourcePath : '',
    asset.storagePath ? path.resolve(root, asset.storagePath) : '',
    asset.publicUrl?.startsWith('/uploads/') ? path.resolve(root, asset.publicUrl.replace(/^\/uploads\//, '')) : '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(root) && candidate !== asset.sourcePath) continue;
    if (fs.existsSync(resolved)) return resolved;
  }

  return '';
}

async function buildImageParts({ assets = [], uploadsRoot, limit = 8 }) {
  const parts = [];
  const imageAssets = assets
    .filter((asset) => asset.kind === 'image' && asset.status === 'active' && asset.includeInAi !== false)
    .slice(0, Math.max(0, limit));

  for (const asset of imageAssets) {
    const filePath = resolveLocalAssetPath(asset, uploadsRoot);
    if (!filePath) continue;

    try {
      const buffer = await sharp(filePath)
        .rotate()
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();

      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: buffer.toString('base64'),
        },
      });
    } catch (err) {
      console.warn(`Gemini image preparation failed for ${asset.publicUrl}:`, err.message);
    }
  }

  return parts;
}

export async function generateGeminiContent({ apiKey, model, prompt, parts = [], maxRetries = 2 }) {
  const key = cleanText(apiKey);
  if (!key) return '';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${normalizeModel(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                ...parts,
              ],
            },
          ],
        }),
      },
    );

    const bodyText = await response.text();
    const data = bodyText ? JSON.parse(bodyText) : {};

    if (response.ok) {
      return cleanText(
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text)
          .filter(Boolean)
          .join('\n'),
      );
    }

    const error = new Error(data?.error?.message || `Gemini request failed with status ${response.status}`);
    if (!isQuotaError(error) || attempt === maxRetries) throw error;

    await sleep(65000);
  }

  return '';
}

export async function generateGeminiProjectMetadata({
  apiKey,
  model,
  project,
  assets = [],
  instructions = '',
  uploadsRoot,
  imageLimit = 8,
}) {
  const title = cleanText(project?.title) || 'Project';
  const category = categoryLabel(project);
  const location = projectLocation(project);
  const imageParts = await buildImageParts({ assets, uploadsRoot, limit: imageLimit });

  const prompt = [
    'You are writing concise premium interior-design portfolio copy for Alexandra Diz.',
    'Return JSON only. No markdown. No comments.',
    'Use English unless the user instructions explicitly request another language.',
    'You receive project metadata, image metadata, and actual project images in the same order as image indexes.',
    'Choose content blocks based on the quantity and visual quality of available images.',
    'Use this core order: heroImage, metaInfo, editorialNote, imageGrid, optional refinedSlider or mosaicPreset, optional sideBySide blocks, typography, ctaSection.',
    'Do not use every supported block type. Keep the page focused and image-led.',
    'When there are many images, put most of them into imageGrid, refinedSlider, or mosaicPreset instead of creating many different block types.',
    'Use imageGrid with 4 to 6 images when enough unique images are available.',
    'If there are extra images after heroImage, editorialNote, and imageGrid, choose either refinedSlider or mosaicPreset. Alternate visual rhythm; do not always choose the same type.',
    'Use sideBySide only when there are still unused strong images after the main grid/slider/mosaic. If using two sideBySide blocks, alternate left and right image positions.',
    'Use fewer text-heavy blocks when there are few images.',
    'Do not repeat images in normal blocks just to fill layout slots. Normal imageIndexes must be unique and valid.',
    'If there is only one image, use heroImage, typography, imageGrid with that one image, and ctaSection. Do not create slider, mosaic, sideBySide, or beforeAfter from repeated copies.',
    'Do not use circleDetail in the general page draft unless explicitly requested.',
    'Only circleDetail may reuse a source image, and only when different crops highlight different specific details.',
    'When you use circleDetail, return 5 to 7 items that focus on specific accents: stone, marble, wood grain, hardware, lighting, joinery, texture, color accents, or custom details.',
    'For each circle detail item, pick the source image and suggest a crop that zooms into the interesting area.',
    'Crop rules: scale between 1.15 and 2.6, x and y between -45 and 45. Keep labels short: 1 to 4 words.',
    'Do not include status in metaInfo. The app derives category, location, and year from the project database.',
    'Never use technical or placeholder phrases such as draft, asset library, editable section, owner-approved, temporary copy, or use this block.',
    'Supported block types: heroImage, metaInfo, typography, sideBySide, imageGrid, refinedSlider, circleDetail, mosaicPreset, beforeAfter, editorialNote, ctaSection.',
    'Do not invent image URLs. Assign images by 1-based imageIndexes from the provided list.',
    'JSON shape:',
    '{"description":"1-2 sentences","seoTitle":"max 60 chars","seoDescription":"max 155 chars","seoKeywords":"comma-separated keywords","blocks":[{"type":"heroImage","title":"...","subtitle":"...","imageIndexes":[1]},{"type":"typography","title":"...","content":"..."},{"type":"sideBySide","title":"...","text":"...","imageIndexes":[2]},{"type":"imageGrid","title":"...","imageIndexes":[1,2,3,4]},{"type":"refinedSlider","title":"...","description":"...","imageIndexes":[1,2,3,4,5,6]},{"type":"circleDetail","title":"...","description":"...","items":[{"imageIndex":1,"label":"Rare marble","crop":{"scale":1.8,"x":12,"y":-6}}]},{"type":"mosaicPreset","title":"...","preset":"a","imageIndexes":[1,2,3,4]},{"type":"beforeAfter","title":"...","imageIndexes":[1,2]},{"type":"editorialNote","eyebrow":"...","title":"...","note":"...","imageIndexes":[3]},{"type":"ctaSection","title":"...","text":"..."}]}',
    '',
    `Project title: ${title}`,
    `Category: ${category}`,
    `Location: ${location}`,
    `Available image assets: ${JSON.stringify(compactAssetList(assets))}`,
    `Actual images attached: ${imageParts.length}`,
    `User instructions: ${cleanText(instructions) || 'No extra instructions.'}`,
  ].join('\n');

  let text = '';
  try {
    text = await generateGeminiContent({ apiKey, model, prompt, parts: imageParts });
  } catch (error) {
    if (!imageParts.length || !isLocationError(error)) throw error;
    console.warn(`Gemini vision unavailable for ${title}, retrying with asset metadata only.`);
    text = await generateGeminiContent({ apiKey, model, prompt, parts: [] });
  }
  const parsed = parseJsonText(text);

  return {
    description: cleanText(parsed.description),
    overviewTitle: cleanText(parsed.overviewTitle),
    scopeTitle: cleanText(parsed.scopeTitle),
    scopeText: cleanText(parsed.scopeText),
    designTitle: cleanText(parsed.designTitle),
    designText: cleanText(parsed.designText),
    detailsTitle: cleanText(parsed.detailsTitle),
    detailsDescription: cleanText(parsed.detailsDescription),
    mosaicTitle: cleanText(parsed.mosaicTitle),
    ctaTitle: cleanText(parsed.ctaTitle),
    ctaText: cleanText(parsed.ctaText),
    blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
    seoTitle: cleanText(parsed.seoTitle),
    seoDescription: cleanText(parsed.seoDescription),
    seoKeywords: Array.isArray(parsed.seoKeywords)
      ? parsed.seoKeywords.map(cleanText).filter(Boolean).join(', ')
      : cleanText(parsed.seoKeywords),
  };
}

export async function generateGeminiBlockText({
  apiKey,
  model,
  project,
  blockType,
  fieldName,
  prompt: userPrompt,
  currentValue,
}) {
  const title = cleanText(project?.title) || 'Project';
  const prompt = [
    'You are writing concise premium interior-design website copy for Alexandra Diz.',
    'Return plain text only. No markdown headings unless requested.',
    'Use English unless the user explicitly asks for another language.',
    '',
    `Project title: ${title}`,
    `Category: ${categoryLabel(project)}`,
    `Location: ${projectLocation(project)}`,
    `Block type: ${cleanText(blockType) || 'unknown'}`,
    `Field: ${cleanText(fieldName) || 'text'}`,
    `Current value: ${cleanText(currentValue) || 'Empty'}`,
    `User request: ${cleanText(userPrompt) || 'Improve or fill this field.'}`,
  ].join('\n');

  return generateGeminiContent({ apiKey, model, prompt });
}
