import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, imageX: 0, imageY: 0 });
  const draggedRef = useRef(false);

  const resetZoom = useCallback(() => {
    setZoomed(false);
    setPosition({ x: 0, y: 0 });
    setDragging(false);
  }, []);

  const toggleZoom = useCallback(() => {
    setZoomed((value) => {
      if (value) setPosition({ x: 0, y: 0 });
      return !value;
    });
  }, []);

  const handlePrev = useCallback(() => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    resetZoom();
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate, resetZoom]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    resetZoom();
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate, resetZoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'z' || event.key === 'Z') toggleZoom();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, handlePrev, handleNext, toggleZoom]);

  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!zoomed) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      imageX: position.x,
      imageY: position.y,
    };
    draggedRef.current = false;
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!zoomed || !dragging) return;
    const start = dragStartRef.current;
    const deltaX = event.clientX - start.pointerX;
    const deltaY = event.clientY - start.pointerY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) draggedRef.current = true;
    const maxX = window.innerWidth * 0.34;
    const maxY = window.innerHeight * 0.34;
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, start.imageX + deltaX)),
      y: Math.max(-maxY, Math.min(maxY, start.imageY + deltaY)),
    });
  };

  const stopDragging = (event: React.PointerEvent<HTMLImageElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const handleImageClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    toggleZoom();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <button className="lightbox-close" onClick={onClose}>x</button>
        <button className="lightbox-zoom" onClick={(event) => { event.stopPropagation(); toggleZoom(); }}>
          {zoomed ? 'Fit' : 'Zoom'}
        </button>

        {images.length > 1 && (
          <>
            <button className="lightbox-nav lightbox-prev" onClick={(event) => { event.stopPropagation(); handlePrev(); }}>{'<'}</button>
            <button className="lightbox-nav lightbox-next" onClick={(event) => { event.stopPropagation(); handleNext(); }}>{'>'}</button>
          </>
        )}

        <div className={`lightbox-content${zoomed ? ' lightbox-content--zoomed' : ''}`} onClick={(event) => event.stopPropagation()}>
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            draggable={false}
            style={zoomed ? { transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(1.28)` } : undefined}
            onClick={handleImageClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          />
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
