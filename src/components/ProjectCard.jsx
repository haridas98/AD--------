import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  return (
    <article className="project-card reveal">
      <Link to={`/project/${project.slug}`} className="project-image-wrap">
        <img src={project.coverImage} alt={project.title} className="project-image" loading="lazy" />
        <div className="image-gradient" />
      </Link>
      <div className="project-body">
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <div className="project-actions">
          <Link to={`/project/${project.slug}`} className="btn-primary">See more</Link>
        </div>
      </div>
    </article>
  );
}
