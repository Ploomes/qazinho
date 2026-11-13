import type { IChangeRead } from './IChangeRead';

/** O que o agente propôs para uma mudança, ou por que não propôs nada. */
export type ChangeReading =
  | { isRead: true; read: IChangeRead }
  | { isRead: false; reason: 'agent-missing' | 'unanswered' };
