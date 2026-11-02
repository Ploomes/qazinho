const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 1 } as const;
const IN = { duration: 0.18, ease: [0.2, 0.8, 0.3, 1] } as const;
const OUT = { duration: 0.12, ease: [0.4, 0, 1, 1] } as const;
const LAND = { opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 } as const;

export const STICKER = {
  spring: SPRING,
  slap: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { ...LAND, transition: IN },
    exit: { opacity: 0, scale: 0.98, transition: OUT },
  },
  panel: {
    initial: { opacity: 0, scale: 0.98, y: 8 },
    animate: { ...LAND, transition: IN },
    exit: { opacity: 0, scale: 0.98, y: 4, transition: OUT },
  },
  pop: {
    initial: { opacity: 0, y: -4 },
    animate: { ...LAND, transition: IN },
    exit: { opacity: 0, y: -4, transition: OUT },
  },
  rise: {
    initial: { opacity: 0, y: 4 },
    animate: { ...LAND, transition: IN },
    exit: { opacity: 0, y: 4, transition: OUT },
  },
  hero: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { ...LAND, transition: { ...SPRING, opacity: { duration: 0.12 } } },
    exit: { opacity: 0, scale: 0.96, transition: OUT },
  },
  speak: {
    initial: { opacity: 0, scale: 0.5, y: -12 },
    animate: {
      ...LAND,
      transition: {
        type: 'spring',
        stiffness: 380,
        damping: 28,
        delay: 0.16,
        opacity: { duration: 0.1, delay: 0.16 },
      },
    },
    exit: { opacity: 0, scale: 0.8, y: -6, transition: OUT },
  },
  drag: { scale: 1.02, zIndex: 6 },
  wobble: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.32, ease: 'easeInOut' },
  },
} as const;
