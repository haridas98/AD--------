import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAppStore } from '../store/useAppStore';
import type { BlogPost, Category, Project } from '../types';
import { collectProjectImages, parseProjectContent } from '../lib/projectBlockTemplates';
import {
  getCanonicalPortfolioProjectPathForCategory,
} from '../lib/portfolioRoutes';
import { homepageDraft } from '../content/homepageDraft';
import { studioTestimonials } from '../content/testimonials';
import { HomeHero } from '../components/home/HomeHero';
import { HomeIntro } from '../components/home/HomeIntro';
import { HomeProjectsGateway } from '../components/home/HomeProjectsGateway';
import { HomeTestimonials } from '../components/home/HomeTestimonials';
import { HomeBlogPreview } from '../components/home/HomeBlogPreview';
import { HomeFinalCta } from '../components/home/HomeFinalCta';
import styles from './HomePage.module.scss';

function getProjectCover(project: Project) {
  const blocks = parseProjectContent(project.content);
  return collectProjectImages(blocks)[0] || '';
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getProjectSummary(project: Project) {
  const blocks = parseProjectContent(project.content);

  for (const block of blocks) {
    const candidates = [
      block.data?.note,
      block.data?.content,
      block.data?.text,
      block.data?.description,
      block.data?.subtitle,
    ];

    const summary = candidates.find((item) => typeof item === 'string' && stripHtml(item).length > 30);

    if (summary) {
      return `${stripHtml(summary).slice(0, 150)}${stripHtml(summary).length > 150 ? '...' : ''}`;
    }
  }

  return 'A curated remodel story shaped around layout clarity, material confidence, and a premium residential finish.';
}

function getCategoryLabel(project: Project, categoryMap: Map<string, Category>) {
  return categoryMap.get(project.categoryId)?.name || 'Selected Project';
}

function formatDateLabel(post: BlogPost) {
  if (!post.publishedAt) return 'Editorial Preview';

  return new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HomePage() {
  const { site, categories, projects, blogPosts } = useAppStore();
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const publishedProjects = projects.filter((project) => project.isPublished);
  const latestProjects = [...publishedProjects]
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 3)
    .map((project, index) => ({
      title: project.title,
      category: getCategoryLabel(project, categoryMap),
      location: project.cityName || 'California',
      year: project.year ? String(project.year) : 'Current',
      summary: getProjectSummary(project),
      href: getCanonicalPortfolioProjectPathForCategory(categoryMap.get(project.categoryId), project.slug),
      image: getProjectCover(project) || undefined,
      accent: homepageDraft.projects.placeholders[index]?.accent || '#d7c0a9',
    }));
  const projectItems = latestProjects.length > 0 ? latestProjects : homepageDraft.projects.placeholders;

  const publishedPosts = blogPosts
    .filter((post) => post.isPublished)
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3)
    .map((post) => ({
      title: post.title,
      excerpt: post.excerpt || 'A short editorial note from the studio journal.',
      href: `/blog/${post.slug}`,
      tag: post.tags?.split(',')[0]?.trim() || 'Journal',
      coverImage: post.coverImage,
      dateLabel: formatDateLabel(post),
    }));
  const blogItems = publishedPosts.length > 0 ? publishedPosts : homepageDraft.blog.placeholders;
  const testimonialData = {
    ...homepageDraft.testimonials,
    items: studioTestimonials.map((item) => ({
      quote: item.text,
      name: item.author,
      role: [item.date, item.link].filter(Boolean).join(' / '),
      image: item.image,
      date: item.date,
    })),
  };

  const heroMetrics = [
    { value: String(publishedProjects.length || 12), label: 'Published projects' },
    { value: String(categories.length || 5), label: 'Core disciplines' },
    { value: String(blogPosts.filter((post) => post.isPublished).length || 3), label: 'Journal entries' },
  ];
  const introMetrics = publishedProjects.length > 0
    ? [
        { value: String(publishedProjects.filter((project) => project.isFeatured).length || 1), label: 'Featured case studies' },
        { value: String(new Set(publishedProjects.map((project) => project.categoryId)).size || categories.length || 1), label: 'Project categories' },
        { value: site?.name ? site.name.split(' ')[0] : 'Alexandra', label: 'Lead voice' },
      ]
    : homepageDraft.intro.fallbackMetrics;

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Architecture & Remodeling</title>
        <meta
          name="description"
          content="Personal-brand homepage for Alexandra Diz: refined interiors, remodel leadership, curated project stories, and a premium client process."
        />
      </Helmet>

      <main className={styles.page}>
        <HomeHero data={homepageDraft.hero} metrics={heroMetrics} styles={styles} />
        <HomeIntro data={homepageDraft.intro} metrics={introMetrics} styles={styles} />
        <HomeProjectsGateway data={homepageDraft.projects} items={projectItems} styles={styles} />
        <HomeTestimonials data={testimonialData} styles={styles} />
        <HomeBlogPreview data={homepageDraft.blog} items={blogItems} styles={styles} />
        <HomeFinalCta data={homepageDraft.finalCta} styles={styles} />
      </main>
    </>
  );
}
