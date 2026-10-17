export const BACKDROP = {
  blur: 'blur(2px)',
  clear: 'blur(0px)',
  panelSpring: { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 },
  panelExit: { duration: 0.16, ease: [0.4, 0, 1, 1] },
} as const;
