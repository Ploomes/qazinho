import type { TargetKind } from '@/shared/types';

/** Um projeto sem ícone de site, mostrado pela plataforma em que roda. */
export interface IProjectPlatformMark {
  kind: 'platform';
  platform: TargetKind;
}
