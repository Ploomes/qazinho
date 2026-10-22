import type { IAskMessage } from '@/modules/Chat/types';

/** A question the run's agent asked the QA, once it ended. */
export interface IAskNoteProps {
  message: IAskMessage;
}
