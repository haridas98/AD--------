import type { Project } from '../types';

function extractYear(value?: string | number | null) {
  if (value == null) return 0;
  const match = String(value).match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

export function getProjectDateWeight(project: Pick<Project, 'completedAt' | 'year' | 'updatedAt' | 'createdAt'>) {
  const realizedYear = extractYear(project.completedAt) || extractYear(project.year);
  if (realizedYear) return realizedYear * 100000000000;

  const updated = project.updatedAt ? Date.parse(project.updatedAt) : 0;
  const created = project.createdAt ? Date.parse(project.createdAt) : 0;
  return updated || created || 0;
}

export function sortProjectsForPortfolio<T extends Project>(projects: T[]) {
  return [...projects].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);

    const dateDiff = getProjectDateWeight(b) - getProjectDateWeight(a);
    if (dateDiff !== 0) return dateDiff;

    return a.title.localeCompare(b.title);
  });
}

export function getProjectDisplayYear(project: Pick<Project, 'completedAt' | 'year' | 'updatedAt' | 'createdAt'>) {
  return extractYear(project.completedAt) || extractYear(project.year) || extractYear(project.updatedAt) || extractYear(project.createdAt);
}
