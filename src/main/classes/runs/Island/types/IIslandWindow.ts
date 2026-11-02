import type { IslandPage } from './IslandPage';
import type { IslandAction } from '@/shared/types';

export interface IIslandWindow {
  preload: string;
  page: IslandPage;
  onAction: (action: IslandAction) => void;
}
