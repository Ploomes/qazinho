import type {
  ChatMessage,
  IErrorMessage,
  IRunMessage,
  IVerdictMessage,
} from '@/modules/Chat';

/**
 * Uma mensagem de chat como o arquivo dela a guarda, formatos antigos incluídos: um log
 * de ações, uma run sem fim, um veredito em palavras.
 */
export type SavedMessage =
  | Exclude<ChatMessage, IRunMessage | IVerdictMessage | IErrorMessage>
  | (Omit<IRunMessage, 'endedBy'> & Partial<Pick<IRunMessage, 'endedBy'>>)
  | (Omit<IVerdictMessage, 'stepNumber' | 'action' | 'runId'> &
      Partial<Pick<IVerdictMessage, 'stepNumber' | 'action' | 'runId'>> & {
        text?: string;
      })
  | (Omit<IErrorMessage, 'runId' | 'detail'> &
      Partial<Pick<IErrorMessage, 'runId' | 'detail'>>)
  | { kind: 'action'; id: string; at: string };
