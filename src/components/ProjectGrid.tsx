import React from 'react';
import ProjectCard from './ProjectCard';
import type { Project } from '../types';

interface ProjectGridProps {
  projects: Project[];
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  if (!projects.length) {
    return (
      <div className="text-center" style={{ padding: '3rem 0' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          No projects available in this section yet.
        </p>
      </div>
    );
  }

  return (
    <div className="cards-grid">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
