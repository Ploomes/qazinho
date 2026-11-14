import type { IPlanDoubt, IPlanStrategy } from '@/shared/types';
import { parse } from 'yaml';

type Loose = Record<string, unknown>;

const STRATEGY_KEYS = ['covers', 'leavesOut', 'where', 'data', 'risks'] as const;

/**
 * O que um plan.yaml guarda além dos casos: a estratégia e as dúvidas que foram à
 * história; o que não dá para ler fica de fora.
 */
export function planExtrasOfYaml(yaml: string): {
  strategy: IPlanStrategy | null;
  doubts: IPlanDoubt[];
} {
  let read: unknown;

  try {
    read = parse(yaml);
  } catch {
    return { strategy: null, doubts: [] };
  }

  const plan = isLoose(read) ? read : {};

  return {
    strategy: strategyOf(plan.strategy),
    doubts: Array.isArray(plan.doubts) ? plan.doubts.flatMap(doubtOf) : [],
  };
}

function strategyOf(value: unknown): IPlanStrategy | null {
  if (!isLoose(value)) return null;

  const texts = STRATEGY_KEYS.map((key) => textOf(value[key]));

  return texts.every((text) => text === '')
    ? null
    : {
        covers: texts[0] ?? '',
        leavesOut: texts[1] ?? '',
        where: texts[2] ?? '',
        data: texts[3] ?? '',
        risks: texts[4] ?? '',
      };
}

function doubtOf(value: unknown): IPlanDoubt[] {
  if (!isLoose(value)) return [];

  const id = textOf(value.id);
  const question = textOf(value.question);

  if (id === '' || question === '') return [];

  const sent = isLoose(value.sent) ? value.sent : null;
  const answer = isLoose(value.answer) ? value.answer : null;

  return [
    {
      id,
      question,
      sent:
        sent === null || textOf(sent.url) === ''
          ? null
          : { url: textOf(sent.url), at: textOf(sent.at) },
      answer:
        answer === null || textOf(answer.text) === ''
          ? null
          : { text: textOf(answer.text), by: textOf(answer.by), at: textOf(answer.at) },
    },
  ];
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isLoose(value: unknown): value is Loose {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
