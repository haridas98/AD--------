import React, { CSSProperties, useCallback, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeInUp, heroBody, heroTitle, standardTransition, viewportOnce } from '../../lib/motion';

interface BeforeAfterBlockProps {
  data: {
    beforeImage: string;
    afterImage: string;
    beforeAlt?: string;
    afterAlt?: string;
    title?: string;
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function BeforeAfterBlock({ data }: BeforeAfterBlockProps) {
  const shouldReduceMotion = useReducedMotion();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [isInteracting, setIsInteracting] = useState(false);

  const sliderStyle = useMemo(
    () => ({ '--slider-position': `${sliderValue}%` } as CSSProperties),
    [sliderValue],
  );

  const updateSlider = useCallback((clientX: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const nextValue = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    setSliderValue(nextValue);
  }, []);

  if (!data.beforeImage || !data.afterImage) return null;

  return (
    <motion.section
      className="container block-before-after"
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {data.title && (
        <motion.div className="block-before-after-head" variants={fadeInUp}>
          <motion.h3 className="block-before-after-title" variants={heroTitle}>
            {data.title}
          </motion.h3>
          <motion.p className="block-before-after-intro" variants={heroBody}>
            Drag or swipe to compare the transformation.
          </motion.p>
        </motion.div>
      )}

      <motion.div
        ref={sliderRef}
        className={`block-before-after-slider${isInteracting ? ' is-active' : ''}`}
        style={sliderStyle}
        transition={standardTransition}
        onPointerDown={(event) => {
          setIsInteracting(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          updateSlider(event.clientX);
        }}
        onPointerMove={(event) => {
          if ((event.buttons & 1) === 1 || isInteracting) {
            updateSlider(event.clientX);
          }
        }}
        onPointerUp={(event) => {
          setIsInteracting(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => setIsInteracting(false)}
        onPointerLeave={() => setIsInteracting(false)}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.002 }}
      >
        <img
          src={data.afterImage}
          alt={data.afterAlt || 'After'}
          className="block-before-after-slider__image block-before-after-slider__image--after"
        />

        <div className="block-before-after-slider__before">
          <img
            src={data.beforeImage}
            alt={data.beforeAlt || 'Before'}
            className="block-before-after-slider__image block-before-after-slider__image--before"
          />
        </div>

        <div className="before-after-label before-after-label--before">Before</div>
        <div className="before-after-label before-after-label--after">After</div>

        <motion.div
          className="slider-line"
          animate={shouldReduceMotion ? undefined : { opacity: isInteracting ? 1 : 0.92 }}
          transition={standardTransition}
        >
          <motion.div
            className="slider-handle"
            animate={shouldReduceMotion ? undefined : { scale: isInteracting ? 1.03 : 1 }}
            transition={standardTransition}
          >
            <span />
            <span />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
