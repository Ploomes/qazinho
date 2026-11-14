import type { NameOrigin } from './NameOrigin';
import type { AppNameSource } from '@/shared/types';

/** Onde ler o nome do app de um projeto sem IA, e como contar ao QA de onde ele veio. */
export interface INameSource {
  source: AppNameSource;
  from: Exclude<NameOrigin, 'agent'>;
}
