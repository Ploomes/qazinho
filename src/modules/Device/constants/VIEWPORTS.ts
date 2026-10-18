import type { IViewportOption } from '@/modules/Device/types';

export const VIEWPORTS: readonly IViewportOption[] = [
  { id: 'desktop', labelKey: 'DEVICE.VIEWPORT_DESKTOP', width: 1280, height: 800 },
  { id: 'tablet', labelKey: 'DEVICE.VIEWPORT_TABLET', width: 820, height: 1180 },
  { id: 'phone', labelKey: 'DEVICE.VIEWPORT_PHONE', width: 390, height: 844 },
];
