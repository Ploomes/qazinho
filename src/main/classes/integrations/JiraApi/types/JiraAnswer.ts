import type { JiraFailure } from '@/shared/types';

/** Com o que o Jira respondeu a um pedido: o corpo, ou por que não, com o que disse. */
export type JiraAnswer =
  | { isOk: true; body: unknown; bytes: ArrayBuffer | null }
  | { isOk: false; failure: JiraFailure; said: string };
