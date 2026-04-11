import React from 'react';
export default function ProjectPage({ project, category }) {
  if (!project) {
    return <main className="container page-pad"><h1>Project not found</h1></main>;
  }

  return (
    <main className="project-page">
      <section className="project-hero reveal">
        <img src={project.coverImage} alt={project.title} className="project-hero-image" />
        <div className="project-hero-overlay" />
        <div className="container project-hero-content">
          <p className="eyebrow">{category?.name || 'Project'}</p>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
        </div>
      </section>

      <section className="container project-content reveal">
        <div className="project-meta">
          {project.location ? <p><strong>Location:</strong> {project.location}</p> : null}
          {project.year ? <p><strong>Year:</strong> {project.year}</p> : null}
        </div>
        <div className="project-description">
          <h2>What was done</h2>
          <p>{project.workDone}</p>
        </div>
      </section>

      <section className="container gallery-grid reveal">
        {(project.gallery || []).map((img, i) => (
          <img key={`${project.id}-${i}`} src={img} alt={`${project.title} ${i + 1}`} loading="lazy" />
        ))}
      </section>
    </main>
  );
}
