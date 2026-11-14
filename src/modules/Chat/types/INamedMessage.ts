import type { NameOrigin } from '@/modules/Project/types';

/** O nome que o projeto ganhou e de onde ele veio, numa linha baixa no chat. */
export interface INamedMessage {
  id: string;
  kind: 'named';
  at: string;
  projectId: string;
  name: string;
  from: NameOrigin;
}
