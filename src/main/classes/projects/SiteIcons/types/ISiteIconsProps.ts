import type { SiteFetcher } from './SiteFetcher';

/** De onde o ícone de um site vem e onde fica guardado entre aberturas do app. */
export interface ISiteIconsProps {
  fetcher: SiteFetcher;
  file: string;
  now: () => number;
}
