import type { ITestCase } from '@/modules/Plan/types';
import type { IDraftedCase } from '@/shared/types';
import { nextCaseId } from './nextCaseId';

/**
 * Os casos que o agente rascunhou, como o plano: um caso mantido conserva o id e se é à
 * mão, e um novo pega um id livre; null quando nenhum tem título e um passo a rodar.
 */
export function planOfDraft(props: {
  cases: IDraftedCase[];
  plan: ITestCase[];
  used: string[];
}): ITestCase[] | null {
  const drafted = props.cases.flatMap<IDraftedCase>((one) => {
    const steps = one.steps
      .map((step) => ({
        action: step.action.trim(),
        expected: step.expected.trim(),
        ...(step.frame === undefined || step.frame.trim() === ''
          ? {}
          : { frame: step.frame.trim() }),
      }))
      .filter((step) => step.action.length > 0 && step.expected.length > 0);
    const title = one.title.trim();

    return title.length === 0 || steps.length === 0 ? [] : [{ ...one, title, steps }];
  });
  const taken = new Set<string>();
  const kept = drafted.map((one) => {
    const id = keptIdOf({ drafted: one, plan: props.plan, taken });

    if (id !== null) taken.add(id);

    return id;
  });
  const used = [...props.used, ...props.plan.map(({ id }) => id)];

  const plan = drafted.map<ITestCase>((one, index) => {
    const id = kept[index] ?? nextCaseId([...used, ...taken]);

    taken.add(id);

    return {
      id,
      title: one.title,
      priority: one.priority,
      goal: one.goal.trim(),
      preconditions: one.preconditions.trim(),
      steps: one.steps,
      lastVerdict: null,
      ...(props.plan.some((kept) => kept.id === id && kept.isManual === true)
        ? { isManual: true }
        : {}),
      ...namesOf({ names: one.sources, key: 'sources' }),
      ...namesOf({ names: one.blockedBy, key: 'blockedBy' }),
    };
  });

  return plan.length === 0 ? null : plan;
}

function keptIdOf(props: {
  drafted: IDraftedCase;
  plan: ITestCase[];
  taken: Set<string>;
}): string | null {
  const { drafted, plan, taken } = props;
  const byId = plan.find(({ id }) => id === drafted.id && !taken.has(id));
  const byTitle = plan.find(({ id, title }) => title === drafted.title && !taken.has(id));

  return byId?.id ?? byTitle?.id ?? null;
}

function namesOf(props: {
  names: string[] | undefined;
  key: 'sources' | 'blockedBy';
}): Partial<Record<'sources' | 'blockedBy', string[]>> {
  const names = (props.names ?? []).map((name) => name.trim()).filter(Boolean);

  return names.length === 0 ? {} : { [props.key]: [...new Set(names)] };
}
