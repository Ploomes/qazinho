export const SAVE_BUTTON = {
  idle: { glyph: '↓', labelKey: 'COMMON.DOWNLOAD' },
  cancelled: { glyph: '↓', labelKey: 'COMMON.DOWNLOAD' },
  saving: { glyph: '↓', labelKey: 'COMMON.SAVING' },
  saved: { glyph: '✓', labelKey: 'COMMON.SAVED' },
  failed: { glyph: '!', labelKey: 'COMMON.SAVE_FAILED' },
} as const;
