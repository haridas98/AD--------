import React from 'react';
import { Link } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard.jsx';

export default function HomePage({ categories, projects }) {
  return (
    <main>
      <section className="hero reveal">
        <div className="hero-bg" />
        <div className="container hero-inner">
          <h1>Interior Architecture & Remodeling</h1>
          <p>Refined California interiors with practical planning, material clarity, and timeless detail.</p>
          <a className="btn-primary" href="#home-sections">Explore projects</a>
        </div>
      </section>

      <section id="home-sections" className="container home-sections">
        {categories.map((category) => {
          const featured = projects.filter((p) => p.categoryId === category.id && p.featuredOnHome && p.published);
          if (!featured.length) return null;

          return (
            <div key={category.id} className="section-block reveal">
              <div className="section-head">
                <h2>{category.homeTitle || category.name}</h2>
                <Link to={`/section/${category.id}`} className="btn-secondary">See all</Link>
              </div>
              <div className="cards-grid">
                {featured.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
