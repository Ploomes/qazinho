import type { IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';

/**
 * As ferramentas do assistente emprestadas a um agente de fora, que já perguntou ao
 * usuário no chat dele: uma chamada pelos mesmos caminhos.
 */
export interface IAppToolStore {
  perform: ((props: { id: string; call: AppToolCall }) => Promise<IToolDone>) | null;
  lend: (perform: IAppToolStore['perform']) => void;
}
