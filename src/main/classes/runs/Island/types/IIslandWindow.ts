import type { IslandPage } from './IslandPage';
import type { IIslandAction } from '@/shared/types';

export interface IIslandWindow {
  preload: string;
  page: IslandPage;
  onAction: (action: IIslandAction) => void;
}
