import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

const videoSections = [
  {
    type: 'featured',
    videoId: 'cX7vUWvPtjs?t=6',
    title: 'Sunnyvale Project',
    description: 'Welcome to our Sunnyvale project, we are doing reconstruction. I think it\'s gonna be really interesting for you. Enjoy the video!',
  },
  {
    type: 'gallery',
    title: 'Video Series',
    items: [
      {
        href: 'https://youtu.be/V5B_DBGzyFg',
        thumb: '/images/legacy/video-1.jpg',
        description: 'This two-minute video-mix about interior designer day in Silicon Valley. I really like this video fragments of Work process, the job site, interesting moments, before and after.',
      },
      {
        href: 'https://www.youtube.com/watch?v=08cTmncWb28',
        thumb: '/images/legacy/video-2.jpg',
        description: 'Tv interview for Channel 9, Israel. It was such a great experience! Talking about design, architecture, new year and small tips for decorating your home sweet home.',
      },
      {
        href: 'https://youtu.be/M1TDoktfpa0',
        thumb: '/images/legacy/video-3.jpg',
        description: 'This is really interesting interview with @anastasiya.filimonova. I told about opened interior design studio in Silicon Valley and features work in California.',
      },
      {
        href: 'https://youtu.be/e4OVbSLc5K0',
        thumb: '/images/legacy/video-4.jpg',
        description: 'Thank you my friends for making it happen! We made a great charity design seminar together. I\'m so happy to be able to share my experience and knowledge and with at the same time to help kids. Charity is an amazing thing for our community!',
      },
    ],
  },
  {
    type: 'project',
    title: 'House in Belmont Remodel',
    thumb: '/images/legacy/video-belmont.jpg',
    description: 'Hello and Welcome to our Belmont project, we are doing reconstruction. I think it\'s gonna be really interesting for you. Enjoy the video!',
  },
  {
    type: 'project-gallery',
    title: 'House in Walnut Creek Remodel',
    items: [
      {
        href: 'https://youtu.be/97_vlJO85I',
        thumb: '/images/legacy/video-walnut-1.jpg',
        description: 'Welcome to our project Walnut Creek. I\'m so happy to show you this space. Totally finished, after all the hard work we\'ve done here.',
      },
      {
        href: 'https://www.youtube.com/watch?v=LSSvMDGluU&t=1s',
        thumb: '/images/legacy/video-walnut-2.jpg',
        description: 'Walnut Creek project walkthrough — kitchen and living space.',
      },
      {
        href: 'https://youtu.be/M1TDoktfpa0',
        thumb: '/images/legacy/video-walnut-3.jpg',
        description: 'Design process and material selection for Walnut Creek.',
      },
      {
        href: 'https://youtu.be/e4OVbSLc5K0',
        thumb: '/images/legacy/video-walnut-4.jpg',
        description: 'Final reveal — Walnut Creek project completed.',
      },
    ],
  },
];

export default function VideoSeriesPage() {
  const { site } = useAppStore();

  return (
    <>
      <Helmet>
        <title>Video Series — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Watch our design process and project walkthroughs" />
      </Helmet>
      <motion.main
        className="container video-series-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">Video Series</h1>

        {/* Featured Video */}
        <section className="video-featured">
          <div className="video-featured__embed">
            <iframe
              src={`https://www.youtube.com/embed/${videoSections[0].videoId}`}
              title={videoSections[0].title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="video-featured__description">{videoSections[0].description}</p>
        </section>

        {/* Video Gallery Grid */}
        {videoSections.slice(1).map((section, i) => (
          <motion.section
            key={i}
            className="video-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <h2 className="video-section__title">{section.title}</h2>

            {'items' in section ? (
              <div className="video-grid">
                {section.items.map((item, j) => (
                  <a
                    key={j}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-card"
                  >
                    <div className="video-card__image">
                      <img src={item.thumb} alt={item.description} loading="lazy" />
                      <div className="video-card__play">
                        <svg viewBox="0 0 68 48" width="48" height="36">
                          <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
                          <path d="M 45,24 27,14 27,34" fill="#fff"/>
                        </svg>
                      </div>
                    </div>
                    <p className="video-card__description">{item.description}</p>
                  </a>
                ))}
              </div>
            ) : 'thumb' in section ? (
              <div className="video-single">
                <div className="video-single__image">
                  <img src={section.thumb} alt={section.title} />
                </div>
                <p className="video-single__description">{section.description}</p>
              </div>
            ) : null}
          </motion.section>
        ))}
      </motion.main>
    </>
  );
}
