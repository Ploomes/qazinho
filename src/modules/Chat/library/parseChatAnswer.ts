import type { ITestCase } from '@/modules/Plan';
import { parseDraftedPlan } from '@/modules/Plan/library';

/** A chat answer is a reply, with a plan only when the QA asked for one; null when it is neither. */
export function parseChatAnswer(
  answer: string,
): { reply: string; plan: ITestCase[] | null } | null {
  let read: { reply?: unknown; plan?: unknown };

  try {
    read = JSON.parse(answer) as { reply?: unknown; plan?: unknown };
  } catch {
    // A resumed session sometimes answers in prose and skips the schema; the prose is still the reply.
    const prose = answer.trim();

    return prose.length === 0 ? null : { reply: prose, plan: null };
  }

  const reply = typeof read.reply === 'string' ? read.reply.trim() : '';
  const plan =
    read.plan === undefined || read.plan === null
      ? null
      : (parseDraftedPlan(JSON.stringify(read.plan))?.plan ?? null);

  if (reply.length === 0 && plan === null) return null;

  return { reply, plan };
}
