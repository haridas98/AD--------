function cleanText(value) {
  return String(value || '').trim();
}

function cleanKeywords(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(', ');
  return cleanText(value);
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(numeric, min), max);
}

function normalizeCrop(crop) {
  return {
    scale: clampNumber(crop?.scale, 1, 2.6, 1.45),
    x: clampNumber(crop?.x, -45, 45, 0),
    y: clampNumber(crop?.y, -45, 45, 0),
  };
}

function categoryLabel(project) {
  return project.category?.name || project.categoryName || 'interior design';
}

function projectLocation(project) {
  return cleanText(project.cityName);
}

function activeImageAssets(assets = []) {
  const seen = new Set();

  return assets
    .filter((asset) => asset.kind === 'image' && asset.status === 'active' && asset.includeInAi !== false && asset.publicUrl)
    .filter((asset) => {
      const key = asset.checksum || asset.publicUrl || asset.storagePath || asset.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0) || String(left.createdAt || '').localeCompare(String(right.createdAt || '')));
}

function toImageBlockAsset(asset, title, index) {
  return {
    url: asset.publicUrl,
    alt: asset.altText || `${title} image ${index + 1}`,
    assetId: asset.id,
  };
}

function imageAt(images, index) {
  if (!Number.isInteger(index) || index < 0 || index >= images.length) return null;
  return images[index] || null;
}

function imageKey(image) {
  return image?.assetId || image?.url || '';
}

function uniqueImages(images) {
  const seen = new Set();
  return images.filter((image) => {
    const key = imageKey(image);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function oneBasedIndexes(startIndex, count, total) {
  if (!total || count <= 0) return [];
  const indexes = [];
  for (let index = startIndex; index <= total && indexes.length < count; index += 1) {
    indexes.push(index);
  }
  return indexes;
}

function hashText(value) {
  return String(value || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function locationPhrase(location) {
  return location ? ` in ${location}` : '';
}

function imageFromPlan(images, imageIndexes = [], fallbackIndex = 0) {
  if (Array.isArray(imageIndexes)) {
    for (const value of imageIndexes) {
      const image = imageAt(images, Number(value) - 1);
      if (image) return image;
    }
  }

  return imageAt(images, fallbackIndex) || imageAt(images, 0);
}

function imagesFromPlan(images, imageIndexes = [], fallbackCount = 4) {
  const planned = Array.isArray(imageIndexes)
    ? uniqueImages(imageIndexes
        .map((value) => imageAt(images, Number(value) - 1))
        .filter(Boolean))
    : [];

  return planned.length ? planned : images.slice(0, fallbackCount);
}

function circleItemsFromPlan(images, plan = {}) {
  const plannedItems = Array.isArray(plan.items)
    ? plan.items
        .map((item, index) => {
          const image = imageAt(images, Number(item?.imageIndex) - 1);
          if (!image) return null;

          return {
            label: cleanText(item?.label),
            image: image.url,
            alt: image.alt,
            assetId: image.assetId,
            crop: normalizeCrop(item?.crop),
          };
        })
        .filter(Boolean)
    : [];

  if (plannedItems.length >= 5) return plannedItems.slice(0, 10);

  const fallbackImages = imagesFromPlan(images, plan.imageIndexes, Math.max(5, Math.min(images.length, 7)));
  const labels = Array.isArray(plan.labels) ? plan.labels : [];

  return fallbackImages.slice(0, 10).map((image, itemIndex) => ({
    label: cleanText(labels[itemIndex]),
    image: image.url,
    alt: image.alt,
    assetId: image.assetId,
    crop: normalizeCrop(),
  }));
}

function buildBlockFromPlan(plan, index, images, defaults) {
  const type = cleanText(plan?.type);
  const id = `ai-${type || 'block'}-${index + 1}`;
  const text = (value, fallback = '') => cleanText(value) || fallback;
  const selectedImages = imagesFromPlan(images, plan?.imageIndexes, 4);
  const selectedImage = imageFromPlan(images, plan?.imageIndexes, index);

  if (type === 'heroImage' && selectedImage) {
    return {
      id,
      type,
      data: {
        title: text(plan.title, defaults.title),
        subtitle: text(plan.subtitle, defaults.description),
        image: selectedImage.url,
        assetId: selectedImage.assetId,
        alt: selectedImage.alt || defaults.title,
      },
    };
  }

  if (type === 'metaInfo') {
    return {
      id,
      type,
      data: {
        source: 'project',
      },
    };
  }

  if (type === 'typography') {
    return {
      id,
      type,
      data: {
        title: text(plan.title, defaults.overviewTitle),
        content: text(plan.content || plan.text, defaults.description),
        size: plan.size === 'lg' || plan.size === 'sm' ? plan.size : 'md',
      },
    };
  }

  if (type === 'sideBySide' && selectedImage) {
    return {
      id,
      type,
      data: {
        title: text(plan.title, defaults.designTitle),
        text: text(plan.text || plan.content, defaults.designText),
        image: selectedImage.url,
        assetId: selectedImage.assetId,
        imagePosition: plan.imagePosition === 'left' ? 'left' : 'right',
      },
    };
  }

  if (type === 'imageGrid' && selectedImages.length) {
    return {
      id,
      type,
      data: {
        title: text(plan.title),
        columns: selectedImages.length > 1 ? 2 : 1,
        images: selectedImages.slice(0, 8),
      },
    };
  }

  if (type === 'refinedSlider' && selectedImages.length > 1) {
    return {
      id,
      type,
      data: {
        title: text(plan.title, 'Project walkthrough'),
        description: text(plan.description, 'A calm visual walkthrough of the finished space.'),
        thumbnailPosition: ['left', 'right', 'bottom'].includes(plan.thumbnailPosition) ? plan.thumbnailPosition : 'bottom',
        images: selectedImages.slice(0, 8),
      },
    };
  }

  if (type === 'circleDetail' && images.length >= 8) {
    const items = circleItemsFromPlan(images, plan);
    if (items.length < 5) return null;

    return {
      id,
      type,
      data: {
        title: text(plan.title, defaults.detailsTitle),
        description: text(plan.description, defaults.detailsDescription),
        items,
      },
    };
  }

  if (type === 'mosaicPreset' && selectedImages.length > 2) {
    return {
      id,
      type,
      data: {
        title: text(plan.title, defaults.mosaicTitle),
        preset: plan.preset === 'b' ? 'b' : 'a',
        images: selectedImages.slice(0, 4),
      },
    };
  }

  if (type === 'beforeAfter' && selectedImages.length > 1) {
    const before = selectedImages[0];
    const after = selectedImages[1] || before;
    return {
      id,
      type,
      data: {
        title: text(plan.title, 'Before / After'),
        beforeImage: before.url,
        afterImage: after.url,
        beforeAlt: before.alt || 'Before',
        afterAlt: after.alt || 'After',
        beforeAssetId: before.assetId,
        afterAssetId: after.assetId,
      },
    };
  }

  if (type === 'editorialNote') {
    const imageData = selectedImage
      ? {
          image: selectedImage.url,
          assetId: selectedImage.assetId,
          alt: selectedImage.alt || defaults.title,
        }
      : {};

    return {
      id,
      type,
      data: {
        eyebrow: text(plan.eyebrow, defaults.category),
        title: text(plan.title, defaults.overviewTitle),
        note: text(plan.note || plan.text || plan.content, defaults.description),
        ...imageData,
      },
    };
  }

  if (type === 'ctaSection') {
    return {
      id,
      type,
      data: {
        title: text(plan.title, defaults.ctaTitle),
        text: text(plan.text || plan.content, defaults.ctaText),
        buttonText: text(plan.buttonText, 'Contact us'),
        buttonLink: text(plan.buttonLink, '/contact'),
      },
    };
  }

  return null;
}

function fallbackBlockPlan(imageCount, title = '') {
  const blocks = [];
  const hasImages = imageCount > 0;
  let cursor = 1;

  if (hasImages) {
    blocks.push({ type: 'heroImage', imageIndexes: [cursor] });
    cursor += 1;
  }

  blocks.push({ type: 'metaInfo' });

  blocks.push({
    type: 'editorialNote',
    imageIndexes: hasImages && cursor <= imageCount ? [cursor] : [],
  });
  if (hasImages && cursor <= imageCount) cursor += 1;

  const gridIndexes = oneBasedIndexes(cursor, Math.min(6, Math.max(4, imageCount - cursor + 1)), imageCount);
  if (gridIndexes.length) {
    blocks.push({ type: 'imageGrid', title: 'Selected views', imageIndexes: gridIndexes });
    cursor += gridIndexes.length;
  }

  const remainingAfterGrid = imageCount - cursor + 1;
  if (remainingAfterGrid >= 3) {
    const visualIndexes = oneBasedIndexes(cursor, Math.min(8, remainingAfterGrid), imageCount);
    const useMosaic = visualIndexes.length >= 4 && hashText(title) % 2 === 0;
    blocks.push(useMosaic
      ? { type: 'mosaicPreset', title: 'Composition highlights', preset: hashText(title) % 3 === 0 ? 'b' : 'a', imageIndexes: visualIndexes.slice(0, 4) }
      : { type: 'refinedSlider', title: 'Design sequence', description: 'A calm visual walkthrough of the finished space.', imageIndexes: visualIndexes });
    cursor += visualIndexes.length;
  }

  const sideIndexes = oneBasedIndexes(cursor, 2, imageCount);
  if (sideIndexes.length) {
    blocks.push({ type: 'sideBySide', title: 'Material balance', imagePosition: 'right', imageIndexes: [sideIndexes[0]] });
  }
  if (sideIndexes.length > 1) {
    blocks.push({ type: 'sideBySide', title: 'Spatial rhythm', imagePosition: 'left', imageIndexes: [sideIndexes[1]] });
  }

  blocks.push({ type: 'typography', title: 'Design language' });
  blocks.push({ type: 'ctaSection' });

  return blocks;
}

export function generateProjectPageDraft({ project, assets = [], instructions = '', metadata = {} }) {
  const title = cleanText(project.title) || 'Project';
  const category = categoryLabel(project);
  const location = projectLocation(project);
  const year = project.year ? String(project.year) : '';
  const images = activeImageAssets(assets).slice(0, 20).map((asset, index) => toImageBlockAsset(asset, title, index));
  const cover = images[0] || null;
  const instructionHint = cleanText(instructions);
  const fallbackDescription = [
    `${title} brings ${String(category).toLowerCase()} into a composed, functional interior${locationPhrase(location)}.`,
    'The story focuses on proportion, material calm, practical flow, and the details that make the space feel resolved.',
    instructionHint ? `The requested direction emphasizes ${instructionHint}.` : '',
  ].filter(Boolean).join(' ');
  const description = cleanText(metadata.description) || fallbackDescription;
  const overviewTitle = cleanText(metadata.overviewTitle) || 'Project overview';
  const designTitle = cleanText(metadata.designTitle) || 'Material balance';
  const designText = cleanText(metadata.designText) || 'The composition is built around clean sightlines, useful storage, layered light, and finishes that support the daily rhythm of the home.';
  const detailsTitle = cleanText(metadata.detailsTitle) || 'Key details';
  const detailsDescription = cleanText(metadata.detailsDescription) || 'Important accents, materials, and small moments of the project.';
  const mosaicTitle = cleanText(metadata.mosaicTitle) || 'Composition highlights';
  const ctaTitle = cleanText(metadata.ctaTitle) || 'Planning a similar remodel?';
  const ctaText = cleanText(metadata.ctaText) || 'Share your goals, constraints, and references, and we will shape them into a clear interior direction.';
  const defaults = {
    title,
    category,
    location,
    year,
    description,
    overviewTitle,
    designTitle,
    designText,
    detailsTitle,
    detailsDescription,
    mosaicTitle,
    ctaTitle,
    ctaText,
  };
  const plannedBlocks = Array.isArray(metadata.blocks) && metadata.blocks.length
    ? metadata.blocks
    : fallbackBlockPlan(images.length, title);
  const plannedContent = plannedBlocks
    .map((block, index) => buildBlockFromPlan(block, index, images, defaults))
    .filter(Boolean);

  if (plannedContent.length) {
    return {
      content: plannedContent,
      seoTitle: cleanText(metadata.seoTitle) || `${title} | Alexandra Diz`,
      seoDescription: cleanText(metadata.seoDescription) || `${title}: ${String(category).toLowerCase()} portfolio project${locationPhrase(location)} by Alexandra Diz.`,
      seoKeywords: cleanKeywords(metadata.seoKeywords) || [title, category, location, 'Alexandra Diz', 'interior design', 'remodeling'].filter(Boolean).join(', '),
    };
  }

  const content = [
    cover
      ? {
          id: 'ai-hero-image',
          type: 'heroImage',
          data: {
            title,
            subtitle: description,
            image: cover.url,
            assetId: cover.assetId,
            alt: title,
          },
        }
      : null,
    {
      id: 'ai-meta-info',
      type: 'metaInfo',
      data: {
        source: 'project',
      },
    },
    {
      id: 'ai-overview',
      type: 'typography',
      data: {
        title: overviewTitle,
        content: description,
        size: 'md',
      },
    },
    imageAt(images, 1)
      ? {
          id: 'ai-design-direction',
          type: 'sideBySide',
          data: {
            title: designTitle,
            text: designText,
            image: imageAt(images, 1).url,
            assetId: imageAt(images, 1).assetId,
            imagePosition: 'right',
          },
        }
      : null,
    images.length
      ? {
          id: 'ai-image-grid',
          type: 'imageGrid',
          data: {
            columns: images.length > 1 ? 2 : 1,
            images: images.slice(0, 8),
          },
        }
      : null,
    images.length > 1
      ? {
          id: 'ai-refined-slider',
          type: 'refinedSlider',
          data: {
            title: 'Project walkthrough',
            description: 'A calm visual walkthrough of the finished space.',
            thumbnailPosition: 'bottom',
            images: images.slice(0, 6),
          },
        }
      : null,
    images.length > 2
      ? {
          id: 'ai-mosaic-preset',
          type: 'mosaicPreset',
          data: {
            title: mosaicTitle,
            preset: 'a',
            images: images.slice(0, 4),
          },
        }
      : null,
    {
      id: 'ai-cta',
      type: 'ctaSection',
      data: {
        title: ctaTitle,
        text: ctaText,
        buttonText: 'Contact us',
        buttonLink: '/contact',
      },
    },
  ].filter(Boolean);

  return {
    content,
    seoTitle: cleanText(metadata.seoTitle) || `${title} | Alexandra Diz`,
    seoDescription: cleanText(metadata.seoDescription) || `${title}: ${String(category).toLowerCase()} portfolio project${locationPhrase(location)} by Alexandra Diz.`,
    seoKeywords: cleanKeywords(metadata.seoKeywords) || [title, category, location, 'Alexandra Diz', 'interior design', 'remodeling'].filter(Boolean).join(', '),
  };
}

export function generateTextDraft({
  project,
  blockType,
  fieldName,
  prompt,
  currentValue,
}) {
  const title = cleanText(project?.title) || 'this project';
  const category = categoryLabel(project || {});
  const location = projectLocation(project || {});
  const request = cleanText(prompt);
  const existing = cleanText(currentValue);

  if (fieldName === 'title') {
    if (blockType === 'imageGrid') return 'Selected project views';
    if (blockType === 'typography') return 'Project overview';
    if (blockType === 'ctaSection') return 'Planning a similar remodel?';
    return `${title} highlight`;
  }

  const base = `${title} is a ${String(category).toLowerCase()} project${locationPhrase(location)}, shaped around composition, materials, light, and the practical rhythm of the space.`;

  if (request) {
    return `${base} ${request}`;
  }

  if (existing) {
    return `${existing}\n\n${base}`;
  }

  return base;
}
