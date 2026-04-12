import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface ServicesPageProps { serviceType: string; }

const servicesData: Record<string, {
  title: string;
  sections: { heading: string; subheading: string; text?: string; items?: { num: string; text: string }[]; images?: string[] }[];
}> = {
  process: {
    title: 'Full Service Interior Design',
    sections: [
      {
        heading: 'Phase I',
        subheading: 'DESIGN CONCEPT SERVICES',
        items: [
          { num: '1.', text: 'Designer meets with the client to discuss the project.' },
          { num: '2.', text: 'Designer guides the client through the process of space analysis and measurements.' },
          { num: '3.', text: 'Designer presents initial design concepts including mood boards, material palettes, and preliminary space plans.' },
        ],
        images: [
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5355731/4714682/61118155/1000-2bb75889f6d2de0be3f4a1280f958f68.JPG',
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5355731/4714682/61118155/1000-f36d9598211fff724ed3d44f356eefe4.png',
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
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5355731/4714682/61118274/1000-13bfc1e8803df594ea1a1c609e24ed8d.jpg',
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5355731/4714682/61118274/1000-fcbe2918031e590d5f40dab9d36cb035.jpg',
        ],
      },
      {
        heading: 'Phase III',
        subheading: 'PROCUREMENT',
        items: [
          { num: '1.', text: 'Designer prepares detailed procurement documents and schedules.' },
          { num: '2.', text: 'All orders are placed, tracked, and managed by the designer.' },
          { num: '3.', text: 'Designer guides the client through the process of showroom visits and orders.' },
        ],
      },
      {
        heading: 'Phase IV',
        subheading: 'CONSTRUCTION SUPPORT',
        items: [
          { num: '1.', text: 'During this phase the designer manages all purchasing, receiving and delivery. We work closely with our contractors and vendors during the whole process of logistics and construction work.' },
          { num: '2.', text: 'The designer is on-site regularly to monitor construction progress and ensure quality.' },
        ],
        images: [
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5355731/4714682/61118410/1000-b1d5058ce0fa90f0fc9c3cf43e1085be.jpg',
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5355731/4714682/61118410/1000-067797657b01a45a441d91ccaf8c20e8.jpg',
        ],
      },
    ],
  },
  process_bath: {
    title: 'Bathroom Remodeling',
    sections: [
      {
        heading: '1.',
        subheading: 'PLANNING OPTIONS',
        text: 'Based on your design preferences, we will create a design proposal which covers several arrangement options. We will discuss all proposed options, analyzing the pros and cons of each option. As a result, we will find the best layout that works for you and implements all needed details.',
        images: ['https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5369393/4735623/61447650/1000-7dd0bf0c721c5b2fc38e0e01d53a31b7.JPG'],
      },
      {
        heading: '2.',
        subheading: '3D PHOTOREALISTIC RENDERINGS',
        text: 'You will be able to easily imagine how the space will look with chosen materials and appliances all together.',
        images: [
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5369393/4735623/61416431/1000-39bab0663c136596737db81cf6bb5a71.jpg',
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5369393/4735623/61416431/1000-837f306bd3acbae4e35e762873dd7d69.jpg',
        ],
      },
      {
        heading: '3.',
        subheading: 'TECHNICAL DOCUMENTATION',
        text: 'Detailed technical drawings for contractors including plumbing, electrical, and ventilation plans.',
      },
      {
        heading: '4.',
        subheading: 'CONSTRUCTION MANAGEMENT',
        text: 'The designer oversees the construction process, ensuring quality and adherence to the design vision.',
      },
    ],
  },
  process_kitchen: {
    title: 'Kitchen Remodeling',
    sections: [
      {
        heading: '1.',
        subheading: 'INITIAL CONSULTATION',
        text: 'We discuss your cooking habits, storage needs, entertaining style, and aesthetic preferences. Budget and timeline are established based on the scope of work.',
      },
      {
        heading: '2.',
        subheading: 'DESIGN & LAYOUT',
        text: 'We optimize the work triangle and create efficient workflow zones. Detailed floor plans with cabinet layout, appliance placement, and lighting design.',
        images: [
          'https://static-cdn4-2.vigbo.tech/u54940/67783/blog/5369394/4735624/61447800/1000-kitchen-design-1.jpg',
        ],
      },
      {
        heading: '3.',
        subheading: 'MATERIAL & APPLIANCE SELECTION',
        text: 'Guided showroom visits for countertops, cabinetry, backsplash, flooring, and appliances. Samples provided for client approval before ordering.',
      },
      {
        heading: '4.',
        subheading: 'PROJECT MANAGEMENT',
        text: 'We coordinate with contractors, electricians, and plumbers. Regular site visits to monitor progress and ensure design integrity.',
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
      <motion.main className="container services-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Sub-nav */}
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

        {/* Sections */}
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
                    <img key={j} src={img} alt="" />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.main>
    </>
  );
}
