import type { IAppBridge } from './types';
import type { AppToolCall, IAppToolAnswer } from '@/shared/types';
import { randomUUID } from 'node:crypto';
import { APP_BRIDGE } from './constants';

/** Hands the assistant's app tool calls to the page, which carries them out through the same stores the QA uses, and waits for what it did. */
export class AppBridge {
  private readonly send: IAppBridge['send'];
  private readonly timeoutMs: number;
  private readonly waiting = new Map<
    string,
    { settle: (done: { text: string; isError: boolean }) => void; timer: NodeJS.Timeout }
  >();

  public constructor(props: IAppBridge) {
    this.send = props.send;
    this.timeoutMs = props.timeoutMs;
  }

  /** Asks the page to carry one call out, and answers what it did, or why nothing was done. */
  public act(call: AppToolCall): Promise<{ text: string; isError: boolean }> {
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

  /** Settles the call the page answered; an answer nobody waits for any more is dropped. */
  public answer(answer: IAppToolAnswer): void {
    const call = this.waiting.get(answer.id);

    if (!call) return;

    clearTimeout(call.timer);
    this.waiting.delete(answer.id);
    call.settle({ text: answer.text, isError: answer.isError });
  }

  /** Lets every call still waiting go, once the page that would have answered it is gone. */
  public dropAll(): void {
    for (const [id, call] of this.waiting) {
      clearTimeout(call.timer);
      this.waiting.delete(id);
      call.settle({ text: APP_BRIDGE.noWindow, isError: true });
    }
  }
}
