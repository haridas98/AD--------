import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface ServicesPageProps { serviceType: string; }

export default function ServicesPage({ serviceType }: ServicesPageProps) {
  const { site } = useAppStore();

  const services: Record<string, { title: string; phases: { phase: string; items: string[]; images?: string[] }[] }> = {
    process: {
      title: 'Full Service Interior Design',
      phases: [
        {
          phase: 'Phase I — DESIGN CONCEPT SERVICES',
          items: [
            'Designer meets with the client to discuss the project scope, style preferences, and budget.',
            'Designer conducts a detailed site analysis and takes measurements.',
            'Designer presents initial design concepts, including mood boards, material palettes, and preliminary space plans.',
          ],
        },
        {
          phase: 'Phase II — DESIGN DEVELOPMENT',
          items: [
            'Designer refines the approved concept into detailed design documents.',
            'Selection of all finishes, fixtures, furniture, and accessories.',
            'Development of detailed floor plans, elevations, and 3D visualizations as needed.',
          ],
        },
        {
          phase: 'Phase III — PROCUREMENT',
          items: [
            'Designer prepares detailed procurement documents and schedules.',
            'All orders are placed, tracked, and managed by the designer.',
            'Designer guides the client through the process of showroom visits and orders.',
          ],
        },
        {
          phase: 'Phase IV — CONSTRUCTION SUPPORT',
          items: [
            'During this phase the designer manages all purchasing, receiving and delivery.',
            'The designer is on-site regularly to monitor construction progress and ensure quality.',
            'We work closely with our contractors and vendors during the whole process of logistics and construction work.',
          ],
        },
      ],
    },
    process_bath: {
      title: 'Bathroom Remodeling',
      phases: [
        {
          phase: 'Initial Consultation',
          items: [
            'We assess your existing bathroom, discuss your vision, and identify functional requirements.',
            'Budget and timeline are established based on the scope of work.',
          ],
        },
        {
          phase: 'Design & Planning',
          items: [
            'Detailed measurements and plumbing/electrical assessment.',
            'Custom design with fixture selection, tile patterns, storage solutions, and lighting plan.',
            'Technical drawings for contractors including plumbing reroutes and ventilation.',
          ],
        },
        {
          phase: 'Material Selection',
          items: [
            'Guided showroom visits for tile, stone, fixtures, vanities, and accessories.',
            'Samples provided for client approval before ordering.',
          ],
        },
        {
          phase: 'Construction & Finishing',
          items: [
            'Coordination with licensed contractors for demolition, plumbing, electrical, and installation.',
            'Regular site visits to monitor progress and quality.',
            'Final styling with accessories, mirrors, hardware, and textiles.',
          ],
        },
      ],
    },
    process_kitchen: {
      title: 'Kitchen Remodeling',
      phases: [
        {
          phase: 'Consultation & Assessment',
          items: [
            'Understand your cooking habits, storage needs, entertaining style, and aesthetic preferences.',
            'Evaluate existing kitchen layout, plumbing, electrical, and structural conditions.',
          ],
        },
        {
          phase: 'Design & Layout',
          items: [
            'Optimize the work triangle and create efficient workflow zones.',
            'Detailed floor plans with cabinet layout, appliance placement, and lighting design.',
            '3D renderings to visualize the final result.',
          ],
        },
        {
          phase: 'Material & Appliance Selection',
          items: [
            'Countertops, cabinetry, backsplash, flooring, and paint colors.',
            'Appliance selection based on performance needs and aesthetic goals.',
            'Hardware, faucets, and lighting fixture specifications.',
          ],
        },
        {
          phase: 'Project Management',
          items: [
            'Coordinate with contractors, electricians, and plumbers.',
            'Monitor construction progress and ensure design integrity.',
            'Final walkthrough and styling for a magazine-ready finish.',
          ],
        },
      ],
    },
  };

  const service = services[serviceType] || services.process;

  return (
    <>
      <Helmet>
        <title>{service.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={service.title} />
      </Helmet>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '100px 15px 60px', maxWidth: '1000px' }}>
        <nav style={{ marginBottom: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'process', name: 'Full Service' },
            { id: 'process_bath', name: 'Bathroom' },
            { id: 'process_kitchen', name: 'Kitchen' },
          ].map((s) => (
            <Link key={s.id} to={`/${s.id}`} style={{ color: serviceType === s.id ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: serviceType === s.id ? '1px solid rgba(198,164,123,1)' : '1px solid transparent', paddingBottom: '4px' }}>
              {s.name}
            </Link>
          ))}
        </nav>

        <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, margin: '0 0 50px', textAlign: 'center', letterSpacing: '0.05em' }}>{service.title}</h1>

        <div style={{ display: 'grid', gap: '50px' }}>
          {service.phases.map((phase, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <h2 style={{ color: 'rgba(198,164,123,1)', fontFamily: "'GilroyLight', sans-serif", fontSize: '14px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 15px' }}>{phase.phase}</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {phase.items.map((item, j) => (
                  <p key={j} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                    <span style={{ color: 'rgba(198,164,123,0.6)', marginRight: '8px' }}>{j + 1}.</span>
                    {item}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.main>
    </>
  );
}
