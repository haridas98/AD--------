import type { Transition, Variants } from 'framer-motion';

export const easeOutQuint = [0.22, 1, 0.36, 1] as const;

export const standardTransition: Transition = {
  duration: 0.55,
  ease: easeOutQuint,
};

export const slowTransition: Transition = {
  duration: 1.2,
  ease: easeOutQuint,
};

export const viewportOnce = {
  once: true,
  amount: 0.2,
} as const;

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: standardTransition,
  },
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: standardTransition,
  },
};

export const staggerContainer = (stagger = 0.12, delayChildren = 0) =>
  ({
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  }) satisfies Variants;

export const heroTitle: Variants = {
  hidden: {
    opacity: 0,
    y: 34,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: easeOutQuint,
      delay: 0.18,
    },
  },
};

export const heroBody: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOutQuint,
      delay: 0.34,
    },
  },
};

export const heroCta: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutQuint,
      delay: 0.48,
    },
  },
};
