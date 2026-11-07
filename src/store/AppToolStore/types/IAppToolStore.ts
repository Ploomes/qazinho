import type {
  ConfirmAction,
  ConfirmDecision,
  IToolDone,
} from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';

/**
 * As ferramentas do assistente emprestadas a um agente de fora: fazer uma chamada pelos
 * caminhos dele, e pedir ao QA que confirme num cartão.
 */
export interface IAppToolStore {
  perform: ((props: { id: string; call: AppToolCall }) => Promise<IToolDone>) | null;
  confirm:
    | ((props: {
        id: string;
        action: ConfirmAction;
        subject: string;
        count: number;
        detail?: string;
      }) => Promise<ConfirmDecision>)
    | null;
  lend: (tools: Pick<IAppToolStore, 'perform' | 'confirm'>) => void;
}
