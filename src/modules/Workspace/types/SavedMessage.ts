import type { ChatMessage, IRunMessage, IVerdictMessage } from '@/modules/Chat';

/** A chat message as its file keeps it, older shapes included: a log of actions, a run with no ending, a verdict in words. */
export type SavedMessage =
  | Exclude<ChatMessage, IRunMessage | IVerdictMessage>
  | (Omit<IRunMessage, 'endedBy'> & Partial<Pick<IRunMessage, 'endedBy'>>)
  | (Omit<IVerdictMessage, 'stepNumber' | 'action'> &
      Partial<Pick<IVerdictMessage, 'stepNumber' | 'action'>> & { text?: string })
  | { kind: 'action'; id: string; at: string };
