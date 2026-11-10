import type { IErrorMessage } from '@/modules/Chat/types';

/** Um erro do QAzinho no chat; `onRetry` vem quando dá para mandar a mensagem de novo. */
export interface IErrorBlockProps {
  message: IErrorMessage;
  onRetry?: () => void;
}
