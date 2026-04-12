// scripts/download-images.mjs
// Extracts image URLs from original HTML files and downloads them
// Usage: node scripts/download-images.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_DIR = path.resolve(__dirname, '../public/legacy');
const OUTPUT_DIR = path.resolve(__dirname, '../scripts/image-downloads');

// Create output directory
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Category mapping from directory names to category slugs
const CATEGORY_MAP = {
  kitchens: 'kitchens',
  'full-house-remodeling': 'full-house-remodeling',
  bathrooms: 'bathrooms',
  adu1: 'adu1',
  fireplaces: 'fireplaces',
  'projects-before-and-after': 'projects-before-and-after',
};

// Image counter per project
const imageCounters = {};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractImagesFromHtml(html, categoryDir, fileName) {
  const images = [];
  
  // Match img src, data-src, data-src2x
  const imgRegex = /(?:src|data-src|data-src2x)\s*=\s*["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let url = match[1];
    // Clean URL - remove query params that vary
    if (url.includes('?')) {
      url = url.split('?')[0];
    }
    images.push(url);
  }
  
  return [...new Set(images)]; // Deduplicate
}

function getProjectNameFromPath(dirPath) {
  // Extract project name from directory path
  const parts = dirPath.split(path.sep);
  // Look for the deepest directory that's not a known category
  const categoryDirs = ['kitchens', 'bathrooms', 'adu1', 'full-house-remodeling', 'fireplaces', 'projects-before-and-after'];
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!categoryDirs.includes(parts[i]) && parts[i] !== 'legacy' && parts[i] !== 'index.html') {
      return parts[i];
    }
  }
  return 'unknown';
}

async function processDirectory(dirPath, relativePath) {
  if (!fs.existsSync(dirPath)) return;
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      // Recursively process subdirectories
      const newRelative = path.join(relativePath, item.name);
      await processDirectory(fullPath, newRelative);
    } else if (item.name === 'index.html' || item.name.endsWith('.html')) {
      // Extract images from this HTML file
      const html = fs.readFileSync(fullPath, 'utf8');
      const images = extractImagesFromHtml(html);
      
      if (images.length > 0) {
        // Determine category and project name
        const relativeParts = relativePath.split(path.sep).filter(p => p);
        let category = null;
        let projectName = 'unknown';
        
        for (const part of relativeParts) {
          if (CATEGORY_MAP[part]) {
            category = CATEGORY_MAP[part];
          }
        }
        
        projectName = getProjectNameFromPath(dirPath);
        projectName = toSlug(projectName);
        
        // Skip root index.html
        if (relativePath === '' || relativePath === '.') {
          continue;
        }
        
        const projectKey = `${category || 'other'}-${projectName}`;
        
        if (!imageCounters[projectKey]) {
          imageCounters[projectKey] = 0;
        }
        
        console.log(`\n📁 ${category || 'other'}/${projectName} (${images.length} images)`);
        
        // Create project directory
        const projectDir = path.join(OUTPUT_DIR, category || 'other', projectName);
        fs.mkdirSync(projectDir, { recursive: true });
        
        // Download images
        for (const imgUrl of images) {
          imageCounters[projectKey]++;
          const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
          const fileName = `${projectName}-${imageCounters[projectKey]}.${ext}`;
          const destPath = path.join(projectDir, fileName);
          
          try {
            await downloadFile(imgUrl, destPath);
            console.log(`  ✅ ${fileName}`);
          } catch (err) {
            console.log(`  ❌ ${fileName}: ${err.message}`);
          }
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Alexandra Diz Image Downloader');
  console.log('==================================');
  console.log(`📂 Scanning: ${LEGACY_DIR}`);
  console.log(`📤 Output: ${OUTPUT_DIR}`);
  console.log('');
  
  // First, scan for all HTML files to understand the structure
  console.log('🔍 Scanning HTML files...');
  await processDirectory(LEGACY_DIR, '');
  
  // Summary
  console.log('\n\n📊 Summary:');
  console.log('=========');
  for (const [key, count] of Object.entries(imageCounters)) {
    const [category, name] = key.split('-');
    console.log(`  ${category}/${name}: ${count} images`);
  }
  
  console.log('\n✅ Done! Images are in:', OUTPUT_DIR);
  console.log('\nNext step: Move images to your project structure manually or run a migration script.');
}

main().catch(console.error);
