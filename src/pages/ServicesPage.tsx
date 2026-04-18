import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface ServicesPageProps { serviceType: string; }

const servicesData: Record<string, {
  title: string;
  intro?: string;
  sections: {
    heading: string;
    subheading: string;
    text?: string;
    items?: { num: string; text: string }[];
    images?: string[];
  }[];
}> = {
  process: {
    title: 'Full Service Interior Design',
    sections: [
      {
        heading: 'Phase I',
        subheading: 'DESIGN CONCEPT SERVICES',
        items: [
          { num: '1.', text: 'Designer meets with the client to discuss the project, understand their lifestyle, needs, and aspirations.' },
          { num: '2.', text: 'Designer guides the client through the process of space analysis and measurements.' },
          { num: '3.', text: 'Designer presents initial design concepts including mood boards, material palettes, and preliminary space plans.' },
        ],
        images: [
          '/images/legacy/process-phase1-1.jpg',
          '/images/legacy/process-phase1-2.png',
        ],
      },
      {
        heading: 'Phase II',
        subheading: 'DESIGN DEVELOPMENT',
        items: [
          { num: '1.', text: 'Designer develops detailed design documents based on approved concept.' },
          { num: '2.', text: 'Selection of all finishes, fixtures, furniture, and accessories.' },
          { num: '3.', text: 'Designer guides the client through the process of showroom visits and orders.' },
        ],
        images: [
          '/images/legacy/process-phase2-1.jpg',
          '/images/legacy/process-phase2-2.jpg',
        ],
      },
      {
        heading: 'Phase III',
        subheading: 'PROCUREMENT',
        items: [
          { num: '1.', text: 'Designer prepares detailed procurement documents and schedules.' },
          { num: '2.', text: 'All orders are placed, tracked, and managed by the designer.' },
          { num: '3.', text: 'Quality control inspections are performed on all received items.' },
        ],
      },
      {
        heading: 'Phase IV',
        subheading: 'CONSTRUCTION SUPPORT',
        items: [
          { num: '1.', text: 'During this phase the designer manages all purchasing, receiving and delivery. We work closely with our contractors and vendors during the whole process of logistics and construction work.' },
          { num: '2.', text: 'The designer is on-site regularly to monitor construction progress and ensure quality and adherence to the design vision.' },
        ],
        images: [
          '/images/legacy/process-phase4-1.jpg',
          '/images/legacy/process-phase4-2.jpg',
        ],
      },
    ],
  },
  process_bath: {
    title: 'Bathroom Remodeling',
    intro: 'We provide following deliverables for your bath remodel project:',
    sections: [
      {
        heading: '1.',
        subheading: 'PLANNING OPTIONS',
        text: 'Based on your design preferences, we will create a design proposal which covers several arrangement options. We will discuss all proposed options, analyzing the pros and cons of each option. As a result, we will find the best layout that works for you and implements all needed details.',
        images: ['/images/legacy/bath-planning.jpg'],
      },
      {
        heading: '2.',
        subheading: '3D PHOTOREALISTIC RENDERINGS',
        text: 'You will be able to easily imagine how the space will look with chosen materials and appliances all together.',
        images: [
          '/images/legacy/bath-3d-1.jpg',
          '/images/legacy/bath-3d-2.jpg',
          '/images/legacy/bath-3d-3.jpg',
          '/images/legacy/bath-3d-4.jpg',
          '/images/legacy/bath-3d-5.jpg',
          '/images/legacy/bath-3d-6.jpg',
          '/images/legacy/bath-3d-7.png',
          '/images/legacy/bath-3d-8.jpeg',
        ],
      },
      {
        heading: '3.',
        subheading: 'TECHNICAL DOCUMENTATION',
        text: 'Detailed technical drawings for contractors including plumbing, electrical, and ventilation plans. Everything needed for a smooth construction process.',
      },
      {
        heading: '4.',
        subheading: 'CONSTRUCTION MANAGEMENT',
        text: 'The designer oversees the construction process, ensuring quality and adherence to the design vision. Regular site visits and coordination with contractors.',
      },
    ],
  },
  process_kitchen: {
    title: 'Kitchen Remodeling',
    intro: 'We provide following deliverables for your kitchen remodel project:',
    sections: [
      {
        heading: '1.',
        subheading: 'PLANNING OPTIONS',
        text: 'Based on your design preferences, we will create a design proposal which covers several arrangement options. We will discuss all proposed options, analyzing the pros and cons of each option. As a result, we will find the best layout that works for you and implements all needed details.',
        images: ['/images/legacy/kitchen-planning.jpg'],
      },
      {
        heading: '2.',
        subheading: '3D PHOTOREALISTIC RENDERINGS',
        text: 'You will be able to easily imagine how the space will look with chosen materials and appliances all together.',
        images: [
          '/images/legacy/kitchen-3d-1.jpg',
          '/images/legacy/kitchen-3d-2.jpeg',
          '/images/legacy/kitchen-3d-3.jpeg',
          '/images/legacy/kitchen-3d-4.jpg',
          '/images/legacy/kitchen-3d-5.jpg',
          '/images/legacy/kitchen-3d-6.jpg',
          '/images/legacy/kitchen-3d-7.jpg',
          '/images/legacy/kitchen-3d-8.jpg',
        ],
      },
      {
        heading: '3.',
        subheading: 'TECHNICAL DOCUMENTATION',
        text: 'Complete technical drawings including cabinet layouts, appliance specifications, plumbing and electrical plans for the contractor.',
      },
      {
        heading: '4.',
        subheading: 'PROJECT MANAGEMENT',
        text: 'We coordinate all aspects of the project from start to finish — ordering materials, managing deliveries, and supervising construction to ensure quality.',
      },
    ],
  },
};

export default function ServicesPage({ serviceType }: ServicesPageProps) {
  const { site } = useAppStore();
  const service = servicesData[serviceType] || servicesData.process;

  return (
    <>
      <Helmet>
        <title>{service.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={service.title} />
      </Helmet>
      <motion.main className="page-shell page-shell--offset services-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-shell__portfolio">
          <nav className="services-nav">
            {[
              { id: 'process', name: 'Full Service Interior Design' },
              { id: 'process_bath', name: 'Bathroom Remodeling' },
              { id: 'process_kitchen', name: 'Kitchen Remodeling' },
            ].map((s) => (
              <Link key={s.id} to={`/${s.id}`} className={`about-nav-link${serviceType === s.id ? ' active' : ''}`}>
                {s.name}
              </Link>
            ))}
          </nav>

          <h1 className="services-title">{service.title}</h1>
          {service.intro && <p className="services-intro">{service.intro}</p>}

          <div className="services-sections">
            {service.sections.map((section, i) => (
              <motion.div key={i} className="service-section" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="service-section-card">
                  <p className="service-section-heading">{section.heading}</p>
                  <p className="service-section-subheading">{section.subheading}</p>
                  {section.items ? (
                    <div className="service-items">
                      {section.items.map((item, j) => (
                        <p key={j} className="service-item">
                          <span className="service-item-num">{item.num}</span>
                          {item.text}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="service-section-text">{section.text}</p>
                  )}
                </div>
                {section.images && (
                  <div className={`service-section-images ${section.images.length > 1 ? 'service-section-images--multi' : 'service-section-images--single'}`}>
                    {section.images.map((img, j) => (
                      <img key={j} src={img} alt="" className="service-img" />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.main>
    </>
  );
}
