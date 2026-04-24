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
  return project.cityName || 'California';
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
        items: [
          { label: 'Category', value: defaults.category },
          { label: 'Location', value: defaults.location },
          { label: 'Year', value: defaults.year },
          { label: 'Status', value: defaults.status },
        ],
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
        description: text(plan.description, 'A visual sequence from the project asset library.'),
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

  if (type === 'editorialNote' && selectedImage) {
    return {
      id,
      type,
      data: {
        eyebrow: text(plan.eyebrow, defaults.category),
        title: text(plan.title, defaults.overviewTitle),
        note: text(plan.note || plan.text || plan.content, defaults.description),
        image: selectedImage.url,
        assetId: selectedImage.assetId,
        alt: selectedImage.alt || defaults.title,
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

function fallbackBlockPlan(imageCount) {
  const blocks = [
    { type: 'typography' },
  ];

  if (imageCount >= 1) blocks.unshift({ type: 'heroImage', imageIndexes: [1] });
  if (imageCount >= 2) blocks.push({ type: 'imageGrid', imageIndexes: [1, 2, 3, 4] });
  if (imageCount >= 4) blocks.push({ type: 'sideBySide', imageIndexes: [2] });
  if (imageCount >= 6) blocks.push({ type: 'refinedSlider', imageIndexes: [1, 2, 3, 4, 5, 6] });
  if (imageCount >= 8) blocks.push({ type: 'circleDetail', imageIndexes: [1, 2, 3, 4, 5] });
  blocks.push({ type: 'ctaSection' });

  return blocks;
}

export function generateProjectPageDraft({ project, assets = [], instructions = '', metadata = {} }) {
  const title = cleanText(project.title) || 'Project';
  const category = categoryLabel(project);
  const location = projectLocation(project);
  const year = project.year ? String(project.year) : 'In progress';
  const status = project.isPublished === false ? 'Draft presentation' : 'Published presentation';
  const images = activeImageAssets(assets).slice(0, 12).map((asset, index) => toImageBlockAsset(asset, title, index));
  const cover = images[0] || null;
  const instructionHint = cleanText(instructions);
  const fallbackDescription = [
    `${title} is a ${String(category).toLowerCase()} project in ${location}.`,
    'The page is prepared as a clean portfolio draft with a short editorial overview and a selected image grid.',
    instructionHint ? `Direction: ${instructionHint}` : '',
  ].filter(Boolean).join(' ');
  const description = cleanText(metadata.description) || fallbackDescription;
  const overviewTitle = cleanText(metadata.overviewTitle) || 'Project overview';
  const scopeTitle = cleanText(metadata.scopeTitle) || 'What was done';
  const scopeText = cleanText(metadata.scopeText) || 'Planning, composition, finishes, storage logic, lighting rhythm, and the overall mood of the space.';
  const designTitle = cleanText(metadata.designTitle) || 'Design direction';
  const designText = cleanText(metadata.designText) || 'Use this block for the main design idea, the client brief, or the logic behind the selected materials and layout decisions.';
  const detailsTitle = cleanText(metadata.detailsTitle) || 'Key details';
  const detailsDescription = cleanText(metadata.detailsDescription) || 'Important accents, materials, and small moments of the project.';
  const mosaicTitle = cleanText(metadata.mosaicTitle) || 'Composition highlights';
  const ctaTitle = cleanText(metadata.ctaTitle) || 'Planning a similar remodel?';
  const ctaText = cleanText(metadata.ctaText) || 'This section is ready for the final project CTA and can be adjusted later in the editor.';
  const defaults = {
    title,
    category,
    location,
    year,
    status,
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
    : fallbackBlockPlan(images.length);
  const plannedContent = plannedBlocks
    .map((block, index) => buildBlockFromPlan(block, index, images, defaults))
    .filter(Boolean);

  if (plannedContent.length) {
    return {
      content: plannedContent,
      seoTitle: cleanText(metadata.seoTitle) || `${title} | Alexandra Diz`,
      seoDescription: cleanText(metadata.seoDescription) || `${title}: ${String(category).toLowerCase()} portfolio project in ${location} by Alexandra Diz.`,
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
        items: [
          { label: 'Category', value: category },
          { label: 'Location', value: location },
          { label: 'Year', value: year },
          { label: 'Status', value: status },
        ],
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
    {
      id: 'ai-scope',
      type: 'typography',
      data: {
        title: scopeTitle,
        content: scopeText,
        size: 'lg',
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
            description: 'A simple visual sequence from the project asset library.',
            thumbnailPosition: 'bottom',
            images: images.slice(0, 6),
          },
        }
      : null,
    images.length >= 6
      ? {
          id: 'ai-circle-detail',
          type: 'circleDetail',
          data: {
            title: detailsTitle,
            description: detailsDescription,
            items: images.slice(0, 5).map((image, index) => ({
              label: '',
              image: image.url,
              alt: image.alt,
              assetId: image.assetId,
              crop: normalizeCrop(),
            })),
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
    seoDescription: cleanText(metadata.seoDescription) || `${title}: ${String(category).toLowerCase()} portfolio project in ${location} by Alexandra Diz.`,
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

  const base = `${title} is presented as a ${String(category).toLowerCase()} project in ${location}, with attention to composition, materials, light, and the practical rhythm of the space.`;

  if (request) {
    return `${base} ${request}`;
  }

  if (existing) {
    return `${existing}\n\n${base}`;
  }

  return base;
}
