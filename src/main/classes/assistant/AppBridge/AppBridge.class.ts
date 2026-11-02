import type { IAppBridge } from './types';
import type { AppToolCall, IAppToolAnswer } from '@/shared/types';
import { randomUUID } from 'node:crypto';
import { APP_BRIDGE } from './constants';

/**
 * Entrega à página as chamadas de ferramenta do app do assistente, que as executa pelas
 * mesmas stores que o QA usa, e espera o que ela fez.
 */
export class AppBridge<Call = AppToolCall> {
  private readonly send: IAppBridge<Call>['send'];
  private readonly timeoutMs: number;
  private readonly waiting = new Map<
    string,
    { settle: (done: { text: string; isError: boolean }) => void; timer: NodeJS.Timeout }
  >();

  public constructor(props: IAppBridge<Call>) {
    this.send = props.send;
    this.timeoutMs = props.timeoutMs;
  }

  /**
   * Pede à página que execute uma chamada, e responde o que ela fez, ou por que nada foi
   * feito.
   */
  public act(call: Call): Promise<{ text: string; isError: boolean }> {
    const id = randomUUID();

    return new Promise((settle) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        settle({ text: APP_BRIDGE.timedOut, isError: true });
      }, this.timeoutMs);

      this.waiting.set(id, { settle, timer });

      if (this.send({ id, call })) return;

      clearTimeout(timer);
      this.waiting.delete(id);
      settle({ text: APP_BRIDGE.noWindow, isError: true });
    });
  }

  /**
   * Resolve a chamada que a página respondeu; uma resposta que ninguém mais espera é
   * descartada.
   */
  public answer(answer: IAppToolAnswer): void {
    const call = this.waiting.get(answer.id);

    if (!call) return;

    clearTimeout(call.timer);
    this.waiting.delete(answer.id);
    call.settle({ text: answer.text, isError: answer.isError });
  }

  /** Solta toda chamada ainda esperando, quando a página que a responderia se foi. */
  public dropAll(): void {
    for (const [id, call] of this.waiting) {
      clearTimeout(call.timer);
      this.waiting.delete(id);
      call.settle({ text: APP_BRIDGE.noWindow, isError: true });
    }
  }
}
