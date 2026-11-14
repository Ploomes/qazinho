import type { ITemplate } from './ITemplate';

/** Um modelo que a página manda guardar: sem id quando é novo. */
export type ISaveTemplate = Omit<ITemplate, 'id' | 'updatedAt'> & { id: string | null };
