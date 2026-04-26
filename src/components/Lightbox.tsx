import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [zoomed, setZoomed] = useState(false);

  const handlePrev = useCallback(() => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setZoomed(false);
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setZoomed(false);
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'z' || event.key === 'Z') setZoomed((value) => !value);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, handlePrev, handleNext]);

  return (
    <AnimatePresence>
      <motion.div className="lightbox-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <button className="lightbox-close" onClick={onClose}>×</button>
        <button className="lightbox-zoom" onClick={(event) => { event.stopPropagation(); setZoomed((value) => !value); }}>
          {zoomed ? 'Fit' : 'Zoom'}
        </button>

        {images.length > 1 && (
          <>
            <button className="lightbox-nav lightbox-prev" onClick={(event) => { event.stopPropagation(); handlePrev(); }}>‹</button>
            <button className="lightbox-nav lightbox-next" onClick={(event) => { event.stopPropagation(); handleNext(); }}>›</button>
          </>
        )}

        <div className={`lightbox-content${zoomed ? ' lightbox-content--zoomed' : ''}`} onClick={(event) => event.stopPropagation()}>
          <img src={images[currentIndex]} alt={`Image ${currentIndex + 1} of ${images.length}`} onClick={() => setZoomed((value) => !value)} />
          {images.length > 1 && (
            <div className="lightbox-counter">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
