import type { IChatAnswer } from '@/shared/types';
import { CHAT_ANSWER } from '@/harness/schemas';

function jsonOf(text: string): { value: unknown } | null {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
}

/** Checks a chat answer against its schema; prose is still a reply, and a broken plan does not cost the reply. */
export function readChatAnswer(text: string): IChatAnswer | null {
  const json = jsonOf(text);

  if (json === null) {
    const prose = text.trim();

    return prose.length === 0 ? null : { reply: prose, plan: null };
  }

  const whole = CHAT_ANSWER.safeParse(json.value);
  const reply = whole.success
    ? whole.data.reply
    : CHAT_ANSWER.pick({ reply: true }).safeParse(json.value).data?.reply;

  if (reply === undefined) return null;

  return { reply: reply.trim(), plan: whole.success ? (whole.data.plan ?? null) : null };
}
