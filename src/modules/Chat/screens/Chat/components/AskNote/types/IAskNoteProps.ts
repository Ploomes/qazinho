import type { IAskMessage } from '@/modules/Chat/types';

/** Uma pergunta que o agente da run fez ao QA, depois que terminou. */
export interface IAskNoteProps {
  message: IAskMessage;
}
