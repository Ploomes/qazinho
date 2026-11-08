import type { BugCategory } from '@/shared/types';

export const BUG_FLASH_HEADLINES = {
  layout: {
    plain: 'DEVICE.BUG_LAYOUT',
    design: 'DEVICE.BUG_LAYOUT_DESIGN',
  },
  text: { plain: 'DEVICE.BUG_TEXT', design: 'DEVICE.BUG_TEXT_DESIGN' },
  style: { plain: 'DEVICE.BUG_STYLE', design: 'DEVICE.BUG_STYLE_DESIGN' },
  behavior: { plain: 'DEVICE.BUG_BEHAVIOR', design: 'DEVICE.BUG_BEHAVIOR' },
  data: { plain: 'DEVICE.BUG_DATA', design: 'DEVICE.BUG_DATA' },
  error: { plain: 'DEVICE.BUG_ERROR', design: 'DEVICE.BUG_ERROR' },
} as const satisfies Record<BugCategory, { plain: string; design: string }>;
