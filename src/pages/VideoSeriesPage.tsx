import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import styles from './VideoSeriesPage.module.scss';

type VideoCard = {
  href: string;
  thumb: string;
  title: string;
  description: string;
};

type FeaturedVideo = {
  type: 'featured';
  videoId: string;
  title: string;
  description: string;
};

type GallerySection = {
  type: 'gallery' | 'project-gallery';
  title: string;
  eyebrow: string;
  items: VideoCard[];
};

type ProjectSection = {
  type: 'project';
  title: string;
  eyebrow: string;
  thumb: string;
  description: string;
};

type VideoSection = FeaturedVideo | GallerySection | ProjectSection;

const videoSections: VideoSection[] = [
  {
    type: 'featured',
    videoId: 'cX7vUWvPtjs?t=6',
    title: 'Sunnyvale Project',
    description:
      'A finished-home walkthrough with Alexandra, showing the decisions that make the remodel feel complete.',
  },
  {
    type: 'gallery',
    eyebrow: 'Studio Notes',
    title: 'Work moments, site visits and conversations.',
    items: [
      {
        href: 'https://youtu.be/V5B_DBGzyFg',
        thumb: '/images/legacy/video-1.jpg',
        title: 'Designer day',
        description: 'A short video mix from the studio rhythm: job site, work process, before and after.',
      },
      {
        href: 'https://www.youtube.com/watch?v=08cTmncWb28',
        thumb: '/images/legacy/video-2.jpg',
        title: 'Channel 9 interview',
        description: 'A TV conversation about design, architecture and small ways to refresh a home.',
      },
      {
        href: 'https://youtu.be/M1TDoktfpa0',
        thumb: '/images/legacy/video-3.jpg',
        title: 'Studio interview',
        description: 'Alexandra speaks about opening an interior design studio in Silicon Valley.',
      },
      {
        href: 'https://youtu.be/e4OVbSLc5K0',
        thumb: '/images/legacy/video-4.jpg',
        title: 'Design seminar',
        description: 'A charity design seminar about sharing experience, knowledge and community support.',
      },
    ],
  },
  {
    type: 'project',
    eyebrow: 'Project Film',
    title: 'House in Belmont Remodel',
    thumb: '/images/legacy/video-belmont.jpg',
    description:
      'A remodel story from Belmont with a look at the site, the planning decisions and the final direction.',
  },
  {
    type: 'project-gallery',
    eyebrow: 'Walkthrough',
    title: 'House in Walnut Creek Remodel',
    items: [
      {
        href: 'https://youtu.be/97_vlJO85I',
        thumb: '/images/legacy/video-walnut-1.jpg',
        title: 'Final reveal',
        description: 'A finished Walnut Creek walkthrough after the full renovation process.',
      },
      {
        href: 'https://www.youtube.com/watch?v=LSSvMDGluU&t=1s',
        thumb: '/images/legacy/video-walnut-2.jpg',
        title: 'Kitchen and living',
        description: 'A closer look at the shared kitchen and living space decisions.',
      },
      {
        href: 'https://youtu.be/M1TDoktfpa0',
        thumb: '/images/legacy/video-walnut-3.jpg',
        title: 'Material selection',
        description: 'Notes on how finishes and materials were edited into one calm direction.',
      },
      {
        href: 'https://youtu.be/e4OVbSLc5K0',
        thumb: '/images/legacy/video-walnut-4.jpg',
        title: 'Completed home',
        description: 'The project after construction, styling and final details.',
      },
    ],
  },
];

const featuredVideo = videoSections[0] as FeaturedVideo;
const contentSections = videoSections.slice(1) as Array<GallerySection | ProjectSection>;

export default function VideoSeriesPage() {
  const { site } = useAppStore();

  return (
    <>
      <Helmet>
        <title>Video Series - {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Project walkthroughs, design notes and video stories from Alexandra Diz." />
      </Helmet>
      <motion.main
        className={styles.page}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.inner}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Video journal</p>
              <h1>Project stories in motion.</h1>
            </div>
            <p>
              Site visits, finished rooms and short conversations about how Alexandra brings a home from plan to
              feeling.
            </p>
          </section>

          <section className={styles.featured}>
            <div className={styles.featuredCopy}>
              <p className={styles.eyebrow}>Featured video</p>
              <h2>{featuredVideo.title}</h2>
              <p>{featuredVideo.description}</p>
            </div>
            <div className={styles.embed}>
              <iframe
                src={`https://www.youtube.com/embed/${featuredVideo.videoId}`}
                title={featuredVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>

          {contentSections.map((section, sectionIndex) => (
            <motion.section
              key={section.title}
              className={styles.section}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: sectionIndex * 0.08 }}
            >
              <div className={styles.sectionIntro}>
                <p className={styles.eyebrow}>{section.eyebrow}</p>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
              </div>

              {'items' in section ? (
                <div className={styles.grid}>
                  {section.items.map((item, itemIndex) => (
                    <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={styles.card}>
                      <div className={styles.cardImage}>
                        <img src={item.thumb} alt={item.title} loading="lazy" />
                        <span className={styles.cardNumber}>{String(itemIndex + 1).padStart(2, '0')}</span>
                        <span className={styles.cardPlay}>Play</span>
                      </div>
                      <div className={styles.cardBody}>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className={styles.single}>
                  <figure className={styles.singleImage}>
                    <img src={section.thumb} alt={section.title} loading="lazy" />
                  </figure>
                  <p className={styles.singleDescription}>{section.description}</p>
                </div>
              )}
            </motion.section>
          ))}
        </div>
      </motion.main>
    </>
  );
}
