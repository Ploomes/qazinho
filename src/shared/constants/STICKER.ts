const SPRING = { type: 'spring', stiffness: 400, damping: 24, mass: 1 } as const;
const PEEL = { duration: 0.18, ease: [0.4, 0, 1, 1] } as const;

export const STICKER = {
  spring: SPRING,
  heroSpring: { type: 'spring', stiffness: 300, damping: 16, mass: 1 },
  slap: {
    initial: { opacity: 0, scale: 1.3, rotate: 8 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { ...SPRING, opacity: { duration: 0.08 } },
    },
    exit: { opacity: 0, scale: 1.04, rotate: 8, x: 6, y: -10, transition: PEEL },
  },
  panel: {
    initial: { opacity: 0, scale: 1.06, rotate: -2, y: 14 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      y: 0,
      transition: { ...SPRING, opacity: { duration: 0.12 } },
    },
    exit: { opacity: 0, scale: 0.98, rotate: 2, x: 8, y: -14, transition: PEEL },
  },
  pop: {
    initial: { opacity: 0, scale: 0.9, rotate: -2, y: -6 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      y: 0,
      transition: { ...SPRING, opacity: { duration: 0.08 } },
    },
    exit: { opacity: 0, scale: 0.96, rotate: 2, y: -6, transition: PEEL },
  },
  hero: {
    initial: { opacity: 0, scale: 1.4, rotate: 14 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 16,
        mass: 1,
        opacity: { duration: 0.1 },
      },
    },
    exit: { opacity: 0, scale: 1.04, rotate: 10, x: 10, y: -14, transition: PEEL },
  },
  wobble: {
    rotate: [0, -3, 3, -2, 1, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
} as const;
