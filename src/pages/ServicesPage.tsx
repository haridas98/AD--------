import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface ServicesPageProps {
  serviceType: string;
}

export default function ServicesPage({ serviceType }: ServicesPageProps) {
  const { site } = useAppStore();

  const services = {
    process: {
      title: 'Full Service Interior Design',
      description: 'Comprehensive interior design services from concept to completion.',
      steps: [
        { title: 'Initial Consultation', desc: 'We discuss your vision, lifestyle, budget, and timeline for the project.' },
        { title: 'Space Planning', desc: 'Detailed floor plans and layouts to optimize functionality and flow.' },
        { title: 'Design Development', desc: 'Material selection, color palettes, furniture, and lighting specifications.' },
        { title: 'Construction Documentation', desc: 'Technical drawings and specifications for contractors.' },
        { title: 'Project Management', desc: 'Oversight during construction to ensure quality and adherence to design.' },
      ],
    },
    process_bath: {
      title: 'Bathroom Remodeling',
      description: 'Transform your bathroom into a luxurious retreat with our specialized remodeling services.',
      steps: [
        { title: 'Assessment', desc: 'Evaluate existing plumbing, electrical, and structural conditions.' },
        { title: 'Design', desc: 'Custom bathroom design with fixture selection, tile patterns, and storage solutions.' },
        { title: 'Planning', desc: 'Detailed plans for plumbing reroutes, lighting, and ventilation.' },
        { title: 'Execution', desc: 'Coordinate with licensed contractors for quality installation.' },
        { title: 'Finishing', desc: 'Final touches including accessories, mirrors, and hardware selection.' },
      ],
    },
    process_kitchen: {
      title: 'Kitchen Remodeling',
      description: 'Create the heart of your home with our expert kitchen design and remodeling services.',
      steps: [
        { title: 'Consultation', desc: 'Understand your cooking habits, storage needs, and aesthetic preferences.' },
        { title: 'Layout Design', desc: 'Optimize the work triangle and create efficient workflow zones.' },
        { title: 'Material Selection', desc: 'Choose countertops, cabinetry, backsplash, and appliances.' },
        { title: 'Technical Planning', desc: 'Coordinate plumbing, electrical, and ventilation requirements.' },
        { title: 'Installation Oversight', desc: 'Monitor construction progress and ensure design integrity.' },
      ],
    },
  };

  const service = services[serviceType as keyof typeof services] || services.process;

  return (
    <>
      <Helmet>
        <title>{service.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={service.description} />
      </Helmet>
      <motion.main className="container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '120px 15px 60px', maxWidth: '900px' }}>
        <nav style={{ marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <Link to="/process" style={{ color: serviceType === 'process' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>Full Service</Link>
          <Link to="/process_bath" style={{ color: serviceType === 'process_bath' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>Bathroom</Link>
          <Link to="/process_kitchen" style={{ color: serviceType === 'process_kitchen' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>Kitchen</Link>
        </nav>
        <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: '32px', fontWeight: 800, margin: '0 0 15px' }}>{service.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px' }}>{service.description}</p>
        <div style={{ display: 'grid', gap: '20px' }}>
          {service.steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={{ display: 'flex', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(198,164,123,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(198,164,123,1)', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.main>
    </>
  );
}
