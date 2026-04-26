import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { studioTestimonials } from '../content/testimonials';

interface AboutPageProps { aboutType: string; }

export default function AboutPage({ aboutType }: AboutPageProps) {
  const { site } = useAppStore();

  const navItems = [
    { id: 'press', name: 'Press | Media' },
    { id: 'testimonials', name: 'Testimonials' },
    { id: 'aboutme', name: 'About me' },
  ];

  const activeItem = navItems.find((n) => n.id === aboutType) || navItems[2];

  return (
    <>
      <Helmet>
        <title>{activeItem.name} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={activeItem.name} />
      </Helmet>
      <motion.main
        className="page-shell page-shell--offset about-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="page-shell__portfolio">
          <nav className="about-nav">
            {navItems.map((s) => (
              <Link key={s.id} to={`/${s.id}`} className={`about-nav-link${aboutType === s.id ? ' active' : ''}`}>
                {s.name}
              </Link>
            ))}
          </nav>

          {aboutType === 'aboutme' && <AboutMeContent />}
          {aboutType === 'press' && <PressContent />}
          {aboutType === 'testimonials' && <TestimonialsContent />}
        </div>
      </motion.main>
    </>
  );
}

function AboutMeContent() {
  return (
    <motion.div className="about-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="about-grid__photo">
        <img src="/images/legacy/aboutme.jpg" alt="Alexandra Diz" className="about-grid__photo-img" />
      </div>
      <div className="about-grid__content">
        <p className="about-text about-text--lead">Hi! I'm Alexandra, and I'm interior designer.</p>
        <p className="about-text">I have a master degree in architecture and I'm working in interior design for more than 10 years, more than 6 of them under my own brand Alexandra Diz.</p>
        <p className="about-text">I studied architecture and it gives me the opportunity to see the space in a new way, and to design it the best possible way for my clients. Here, at Alexandra Diz, we think about layout flow, light, textures and a lot about design and creating the best version of your home.</p>
        <p className="about-text">I worked in Russia, Germany, Israel and California. I speak Russian, Hebrew, German and English.</p>
        <p className="about-text">I'm helping my clients through all the design process, starting from first ideas and sketches, going through all drawings and planning, permit process and 3d visualizations, orders, and standing by during the construction.</p>
        <p className="about-text">I will be happy to assist you with the project and make the best version of your home!</p>

        <div className="about-info-grid">
          <div className="about-info-item">
            <h3>Education</h3>
            <p>Saint Petersburg Academy of Fine Arts and Germany Bauhaus-Universität Weimar.</p>
          </div>
          <div className="about-info-item">
            <h3>Awards</h3>
            <p>Top 10 interior designer in Israel 2019</p>
          </div>
        </div>

        <Link to="/contact" className="btn-primary">Get in Touch</Link>
      </div>
    </motion.div>
  );
}

const pressItems = [
  {
    image: '/images/legacy/press-1.jpg',
    title: '"Provence in the Holy City: Renovation of a House in Jerusalem"',
    publication: 'BVD.co.il',
    year: '2015',
    href: 'https://www.bvd.co.il/%d7%a2%d7%99%d7%a6%d7%95%d7%91-%d7%91%d7%aa%d7%99%d7%9d-%d7%91%d7%aa%d7%99%d7%9d-%d7%9e%d7%a2%d7%95%d7%a6%d7%91%d7%99%d7%9d-%d7%9e%d7%91%d7%97%d7%a8-%d7%9b%d7%aa%d7%91%d7%95%d7%aa-%d7%98%d7%99/%d7%a9%d7%99%d7%a4%d7%95%d7%a6%d7%99%d7%9d-%d7%a9%d7%99%d7%a4%d7%95%d7%a5-%d7%94%d7%91%d7%99%d7%aa-%d7%97%d7%99%d7%93%d7%95%d7%a9-%d7%94%d7%91%d7%99%d7%aa-%d7%a9%d7%99%d7%a4%d7%95%d7%a5-%d7%93/%d7%a4%d7%a8%d7%95%d7%91%d7%a0%d7%a1-%d7%91%d7%a2%d7%99%d7%a8-%d7%94%d7%a7%d7%95%d7%93%d7%a9-%d7%a9%d7%99%d7%a4%d7%95%d7%a5-%d7%91%d7%99%d7%aa-%d7%a7%d7%91%d7%9c%d7%a0%d7%99-%d7%91%d7%99%d7%a8%d7%95/',
  },
  {
    image: '/images/legacy/press-2.jpg',
    title: 'Mini Interview with Designer Alexandra Diz',
    publication: 'Alfagrafix Media',
    year: 'November 2016',
    href: 'https://www.facebook.com/notes/alfagrafix-media/%D0%BC%D0%B8%D0%BD%D0%B8-%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B2%D1%8C%D1%8E-%D1%81-%D0%B0%D0%BB%D0%B5%D0%BA%D1%81%D0%B0%D0%BD%D0%B4%D1%80%D0%BE%D0%B9-%D0%B4%D0%B8%D0%B7/1423521797680758/',
  },
  {
    image: '/images/legacy/press-3.jpg',
    title: '"10 Facts About Interior Design in Israel"',
    publication: 'BeInIsrael.com',
    year: 'April 2017',
    href: 'https://beinisrael.com/style/interior/10-faktov-o-dizajne-interera-v-izraile/?fbclid=IwAR2-GU3Y3wzLt-0xQhzgJhVYoWmN4EWFyNje3gKf5y4QQgFmBHkhEGNiQdQ',
  },
  {
    image: '/images/legacy/press-4.png',
    title: '"Advanced Technology, Natural Materials"',
    publication: 'Mako.Living',
    year: '',
    href: 'https://www.mako.co.il/living-architecture/local-renovation/Article-1018e301a82da51006.htm',
  },
  {
    image: '/images/legacy/press-5.png',
    title: 'Designer Alexandra Diz — Featured Project',
    publication: 'Houzz Editorial',
    year: '',
    href: '#',
  },
  {
    image: '/images/legacy/press-6.jpg',
    title: 'Interior Design Trends — Expert Commentary',
    publication: 'Houzz',
    year: '',
    href: '#',
  },
  {
    image: '/images/legacy/press-7.png',
    title: 'Apartment Renovation — Before & After Feature',
    publication: 'Design Magazine',
    year: '',
    href: '#',
  },
  {
    image: '/images/legacy/press-8.png',
    title: 'Modern Living Spaces — Design Inspiration',
    publication: 'Architecture Today',
    year: '',
    href: '#',
  },
  {
    image: '/images/legacy/press-9.jpg',
    title: 'Home Makeover — Professional Design Tips',
    publication: 'Houzz',
    year: '',
    href: '#',
  },
  {
    image: '/images/legacy/press-10.jpg',
    title: 'Luxury Bathroom Design — Case Study',
    publication: 'Interior Design Review',
    year: '',
    href: '#',
  },
  {
    image: '/images/legacy/press-11.jpg',
    title: 'Contemporary Kitchen — Design Portfolio',
    publication: 'Design Portfolio',
    year: '',
    href: '#',
  },
];

function PressContent() {
  return (
    <motion.div className="press-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h2 className="press-title">Press</h2>
      <div className="press-gallery">
        {pressItems.map((item, i) => (
          <a
            key={i}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="press-card"
          >
            <div className="press-card__image">
              <img src={item.image} alt={item.title} loading="lazy" />
            </div>
            <div className="press-card__caption">
              <p className="press-card__title">{item.title}</p>
              {(item.publication || item.year) && (
                <p className="press-card__meta">
                  {item.publication}{item.publication && item.year && ' | '}{item.year}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
      <p className="press-contact">For media inquiries and press features, please contact us directly at <a href="mailto:alexandra@alexandradiz.com">alexandra@alexandradiz.com</a></p>
    </motion.div>
  );
}

const testimonials = [
  {
    date: 'April, 2020',
    text: 'A few months ago, in 2019, I was about to renovate the interior of my apartment, when many of my friends recommended Alexandra to me. I am infinitely glad that I turned to her professional services! Alexandra is an incredibly talented designer, full of wonderful ideas and a delicate taste. She is very attentive to details, recognizes all my needs, keeps in touch and has known exactly how to help me realize dreams in the interior of my home. I highly recommend her services. You will be very satisfied, and your home will gain a new life!',
    author: 'Irina Antonova',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: '/images/legacy/testimonial-erika.jpg',
    projectHref: '#',
  },
  {
    date: 'April, 2020',
    text: 'I\'m extremely satisfied with the Alexandra\'s job. She had grate ideas, very professional attitude and sweet personality :) I would never be able to remodel those two bathrooms on my own.',
    author: 'Rita Roysental',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: null,
    projectHref: null,
  },
  {
    date: 'March, 2020',
    text: 'אלכסנדרה יקרה רצינו להגיד לך תודה רבה. מהתחלה העבודה איתך היתה נעימה ומקצועית. הקשבת לנו ולרצונות שלנו וביחד עם זה הצעת הרבה רעיונות שהיו נהדרים הרבה יותר משלנו. תודה שהיית רגועה ומרגיעה, מקצועית ונעימה. הבית לא היה נראה אותו דבר בלעדייך. בנוסף לכל זה הגיע הסטייג\'ינג אתמול. הגעת עם כל החברות המקצועיות שלך והפכתם את הבית למקום חמים ונעים כמו שבית יכול וצריך להיות.',
    author: 'Erika and Shimon',
    link: null,
    linkHref: null,
    image: '/images/legacy/testimonial-erika.jpg',
    projectHref: 'http://alexandradiz.com/LivrermoreCalifornia',
    projectText: 'Press to see the project',
  },
  {
    date: 'June 26, 2019',
    text: 'Hiring Alexandra was the best decision we made when decorating our new home. She is a pleasure to work with, has great taste, is highly organized and her attention to detail is most impressive. She redesigned our entire upstairs, along with customizing details throughout. In addition, she added countless features we didn\'t even know we needed and helped us with absolutely everything. She did an outstanding job!',
    author: 'Sergey Stelmakh',
    link: '@linkedin',
    linkHref: 'https://www.linkedin.com/in/alexandradiz',
    image: '/images/legacy/testimonial-sergey.jpg',
    projectHref: 'http://alexandradiz.com/california-ocean-house-in-paccifica',
    projectText: 'Press to see the project',
  },
  {
    date: 'May 8, 2019',
    text: 'We hired Alexandra for a short-term project to redesign our new apartment. The apartment was large but the internal spaces planning did not match our needs and we were looking for a change. Alexandra came up with multiple creative ideas we did not even think were possible. After we had made our choice, Alexandra provided detailed sketches extremely fast. She was always open for iterations in cases we asked to provide several design options, and her patience was endless. Besides, she is a very nice person to work with — always very friendly, positive and responsive. Always on time and with a smile. I highly recommend her work if you wish to build your dream home.',
    author: 'Homeowner, Pacifica',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: null,
    projectHref: null,
  },
  {
    date: '2019',
    text: 'Alexandra transformed our home beyond what we imagined possible. Her eye for detail, creative use of space, and ability to understand exactly what we wanted made the entire process smooth and enjoyable. We couldn\'t be happier with the result.',
    author: 'Client, Los Altos',
    link: null,
    linkHref: null,
    image: null,
    projectHref: null,
  },
  {
    date: '2020',
    text: 'Working with Alexandra was an incredible experience from start to finish. She listened to our needs, presented creative solutions we hadn\'t considered, and managed every detail of the project flawlessly. Our new kitchen and bathrooms are beautiful and functional.',
    author: 'Homeowner, Redwood City',
    link: null,
    linkHref: null,
    image: null,
    projectHref: null,
  },
];

function TestimonialsContent() {
  return (
    <motion.div className="testimonials-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h2 className="testimonials-page__subtitle">REVIEWS</h2>
      <h2 className="testimonials-page__title">What our clients say</h2>

      <div className="testimonials-list">
        {studioTestimonials.map((t, i) => (
          <div key={i} className="testimonial-item">
            <div className="testimonial-item__header">
              <div className="testimonial-item__date">{t.date}</div>
              {t.image && (
                <div className="testimonial-item__photo">
                  <img src={t.image} alt={t.author} />
                </div>
              )}
            </div>
            <div className="testimonial-item__body">
              <p className="testimonial-item__text">{t.text}</p>
              <div className="testimonial-item__footer">
                <div className="testimonial-item__author">
                  <strong>{t.author}</strong>
                  {t.link && (
                    <a href={t.linkHref} target="_blank" rel="noopener noreferrer" className="testimonial-item__link">
                      {t.link}
                    </a>
                  )}
                </div>
                {t.projectHref && (
                  <a href={t.projectHref} target="_blank" rel="noopener noreferrer" className="btn-see-project">
                    {t.projectText || 'Press to see the project'}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
