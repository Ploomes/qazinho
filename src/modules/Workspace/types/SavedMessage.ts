import type {
  ChatMessage,
  IErrorMessage,
  IRunMessage,
  IVerdictMessage,
} from '@/modules/Chat';

/** A chat message as its file keeps it, older shapes included: a log of actions, a run with no ending, a verdict in words. */
export type SavedMessage =
  | Exclude<ChatMessage, IRunMessage | IVerdictMessage | IErrorMessage>
  | (Omit<IRunMessage, 'endedBy'> & Partial<Pick<IRunMessage, 'endedBy'>>)
  | (Omit<IVerdictMessage, 'stepNumber' | 'action' | 'runId'> &
      Partial<Pick<IVerdictMessage, 'stepNumber' | 'action' | 'runId'>> & {
        text?: string;
      })
  | (Omit<IErrorMessage, 'runId'> & Partial<Pick<IErrorMessage, 'runId'>>)
  | { kind: 'action'; id: string; at: string };
