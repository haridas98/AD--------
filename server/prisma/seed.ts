import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

async function main() {
  console.log('Seeding database...');

  const dataPath = path.resolve('data/content.json');
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Seed categories
  for (const cat of rawData.categories) {
    await prisma.category.upsert({ where: { slug: cat.id }, update: {}, create: { id: cat.id, name: cat.name, slug: cat.id, showInHeader: true } });
  }
  console.log(`Categories: ${rawData.categories.length}`);

  // Seed projects
  for (const proj of rawData.projects) {
    const slug = proj.slug || toSlug(proj.title);
    const contentBlocks = [];
    if (proj.coverImage) contentBlocks.push({ type: 'heroImage', data: { image: proj.coverImage, alt: proj.title, title: proj.title, subtitle: proj.summary } });
    if (proj.location) contentBlocks.push({ type: 'metaInfo', data: { items: [{ label: 'Location', value: proj.location }] } });
    if (proj.workDone) contentBlocks.push({ type: 'typography', data: { title: 'What was done', content: proj.workDone } });
    if (proj.gallery?.length) contentBlocks.push({ type: 'imageGrid', data: { images: proj.gallery.map((url) => ({ url, alt: proj.title })) } });

    await prisma.project.upsert({ where: { slug }, update: {}, create: { id: proj.id, title: proj.title, slug, categoryId: proj.categoryId, isFeatured: proj.featuredOnHome || false, isPublished: proj.published !== false, content: JSON.stringify(contentBlocks), seoTitle: proj.title, seoDescription: proj.summary } });
  }
  console.log(`Projects: ${rawData.projects.length}`);

  // Seed blog posts
  const blogPosts = [
    {
      title: '5 Trends in Modern Kitchen Design for 2026',
      excerpt: 'Discover the latest trends in kitchen remodeling — from sustainable materials to smart storage solutions that transform your cooking space.',
      content: `<h2>1. Sustainable Materials Take Center Stage</h2><p>Homeowners are increasingly choosing eco-friendly materials like bamboo cabinetry, recycled glass countertops, and low-VOC finishes. These materials not only reduce environmental impact but also bring a natural warmth to kitchen spaces.</p><img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800" alt="Sustainable kitchen design" /><h2>2. Smart Storage Solutions</h2><p>Hidden pantries, pull-out shelves, and multi-functional islands are becoming essential. The goal is to keep countertops clear while maximizing every inch of available space.</p><h2>3. Bold Color Palettes</h2><p>Gone are the days of all-white kitchens. Deep navy, forest green, and warm terracotta are making strong statements in modern kitchen design.</p><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800" alt="Bold kitchen colors" /><h2>4. Integrated Appliances</h2><p>Panel-ready appliances that blend seamlessly with cabinetry create a streamlined, uncluttered look. This trend is especially popular in open-concept homes.</p><h2>5. Statement Lighting</h2><p>Oversized pendant lights, sculptural chandeliers, and layered lighting schemes are turning kitchens into design showcases.</p>`,
      isPublished: true,
      tags: 'kitchen,design,trends,2026'
    },
    {
      title: 'How to Plan a Bathroom Remodel That Stands the Test of Time',
      excerpt: 'A step-by-step guide to planning a bathroom renovation that balances style, functionality, and long-term value.',
      content: `<h2>Start With a Clear Vision</h2><p>Before demo begins, define your must-haves versus nice-to-haves. Consider who uses the bathroom most and what functions matter — a soaking tub for relaxation or a spacious shower for efficiency?</p><img src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800" alt="Modern bathroom design" /><h2>Choose Durable Materials</h2><p>Porcelain tile, quartz countertops, and solid-surface vanities offer the best combination of beauty and durability in a high-moisture environment.</p><h2>Invest in Good Ventilation</h2><p>A quality exhaust fan is the unsung hero of bathroom design. It prevents mold, protects your investment, and keeps the space feeling fresh.</p><h2>Plan Your Lighting</h2><p>Layer your lighting: ambient for overall illumination, task lighting around the mirror, and accent lights for architectural features.</p><img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800" alt="Bathroom lighting" /><h2>Don\'t Forget Storage</h2><p>Recessed medicine cabinets, vanity drawers with organizers, and niche shelving in the shower keep essentials accessible but out of sight.</p>`,
      isPublished: true,
      tags: 'bathroom,remodel,planning,guide'
    },
    {
      title: 'The Rise of ADUs: Adding Value and Space to California Homes',
      excerpt: 'Accessory Dwelling Units are transforming single-family properties across the Bay Area. Here\'s why homeowners are investing.',
      content: `<h2>What Is an ADU?</h2><p>An Accessory Dwelling Unit (ADU) is a secondary housing unit on a single-family residential lot. It can be attached to the main house, detached, or even a converted garage.</p><img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800" alt="Modern ADU exterior" /><h2>Why California Loves ADUs</h2><p>Recent legislation has made it easier than ever to build ADUs in California. Cities are streamlining permits, and many have waived impact fees for units under 750 square feet.</p><h2>Popular ADU Uses</h2><ul><li>Guest house for visiting family and friends</li><li>Rental income — Bay Area ADUs can fetch $2,000-$3,500/month</li><li>Home office or studio</li><li>Aging-in-place solution for elderly parents</li></ul><h2>Design Considerations</h2><p>Maximize natural light, choose multi-functional furniture, and keep the layout open. Even 400 square feet can feel spacious with the right design approach.</p><img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800" alt="ADU interior design" /><h2>Return on Investment</h2><p>A well-designed ADU typically adds 20-30% to property value while generating ongoing rental income — making it one of the smartest home improvements in today\'s market.</p>`,
      isPublished: true,
      tags: 'ADU,California,real estate,investment'
    },
    {
      title: 'Creating a Timeless Fireplace: Design Ideas That Never Go Out of Style',
      excerpt: 'From modern minimalist to classic stone, fireplaces remain the heart of the home. Explore designs that blend beauty and warmth.',
      content: `<h2>The Focal Point of Any Room</h2><p>A well-designed fireplace anchors the entire room. Whether it\'s a sleek linear gas fireplace or a classic wood-burning hearth, the design should complement your home\'s architectural style.</p><img src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800" alt="Modern fireplace design" /><h2>Material Matters</h2><p>Natural stone, marble, and brick offer timeless appeal. For a contemporary look, consider large-format porcelain tiles or a polished concrete surround.</p><h2>Scale and Proportion</h2><p>The fireplace should be proportional to the room. A massive stone hearth overwhelms a small bedroom, while a slim modern unit gets lost in a great room.</p><h2>Built-In Shelving</h2><p>Flanking your fireplace with built-in bookshelves creates a library-like warmth and provides display space for art, books, and personal mementos.</p><img src="https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800" alt="Fireplace with built-in shelves" /><h2>Energy Efficiency</h2><p>Modern gas and electric fireplaces are incredibly efficient. Look for units with sealed combustion and zone heating capabilities to reduce energy waste.</p>`,
      isPublished: true,
      tags: 'fireplace,design,interior,home'
    }
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: {
        title: post.title,
        slug: toSlug(post.title),
        excerpt: post.excerpt,
        content: post.content,
        isPublished: post.isPublished,
        tags: post.tags,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
    console.log(`Blog: ${post.title}`);
  }

  console.log('Seed complete!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
