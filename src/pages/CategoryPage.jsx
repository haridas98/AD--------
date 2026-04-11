import React from 'react';
import ProjectCard from '../components/ProjectCard.jsx';

export default function CategoryPage({ category, projects }) {
  if (!category) {
    return <main className="container page-pad"><h1>Section not found</h1></main>;
  }

  return (
    <main className="container page-pad">
      <header className="page-title reveal">
        <h1>{category.name}</h1>
        <p>Selected projects in the {category.name.toLowerCase()} direction.</p>
      </header>
      <div className="cards-grid">
        {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
      </div>
    </main>
  );
}
