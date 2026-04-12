import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  return (
    <motion.article
      className="project-card reveal"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link to={`/project/${project.slug}`} className="project-image-wrap">
        <img
          src={project.coverImage}
          alt={project.title}
          className="project-image"
          loading="lazy"
        />
        <div className="image-gradient" />
      </Link>
      <div className="project-body">
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <div className="project-actions">
          <Link to={`/project/${project.slug}`} className="btn-primary">
            See more
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
