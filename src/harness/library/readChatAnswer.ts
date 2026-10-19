import type { IChatAnswer } from '@/shared/types';
import { CHAT_ANSWER } from '@/harness/schemas';

function jsonOf(text: string): { value: unknown } | null {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
}

function fieldOf(props: { value: unknown; key: string }): unknown {
  return typeof props.value === 'object' && props.value !== null
    ? (props.value as Record<string, unknown>)[props.key]
    : undefined;
}

function withoutNullIds(plan: unknown): unknown {
  const cases = fieldOf({ value: plan, key: 'cases' });

  if (!Array.isArray(cases)) return plan;

  return {
    ...(plan as Record<string, unknown>),
    cases: cases.map((one: unknown) =>
      fieldOf({ value: one, key: 'id' }) === null
        ? { ...(one as Record<string, unknown>), id: undefined }
        : one,
    ),
  };
}

/** Checks a chat answer against its schema; prose is still a reply, and a part that breaks the schema costs only itself. */
export function readChatAnswer(text: string): IChatAnswer | null {
  const json = jsonOf(text);

  if (json === null) {
    const prose = text.trim();

    return prose.length === 0 ? null : { reply: prose, questions: [], plan: null };
  }

  const field = (key: string) => fieldOf({ value: json.value, key });
  const reply = CHAT_ANSWER.shape.reply.safeParse(field('reply')).data;

  if (reply === undefined) return null;

  const questions = CHAT_ANSWER.shape.questions.safeParse(field('questions')).data ?? [];

  return {
    reply: reply.trim(),
    questions: questions.map(({ multiSelect, ...question }) => ({
      ...question,
      isMultiSelect: multiSelect,
    })),
    plan: CHAT_ANSWER.shape.plan.safeParse(withoutNullIds(field('plan'))).data ?? null,
  };
}
