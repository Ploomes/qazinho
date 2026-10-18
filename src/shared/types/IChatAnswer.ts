import type { IDraftedCase } from './IDraftedCase';

/** A chat answer main already checked: the reply, and a drafted plan only when the QA asked for one. */
export interface IChatAnswer {
  reply: string;
  plan: { summary: string; cases: IDraftedCase[] } | null;
}
