import type { AttachFailure } from './AttachFailure';
import type { IChatAttachment } from './IChatAttachment';

/** Os arquivos que ficaram anexados ao chat, ou por que nenhum ficou. */
export type AttachOutcome =
  | { isAttached: true; attachments: IChatAttachment[] }
  | { isAttached: false; failure: AttachFailure };
