import type { IPendingChange, ITestCase } from '@/modules/Plan/types';
import type { IChangeBrief, IPlanDoubt, Language } from '@/shared/types';

/** O que o leitor de uma mudança recebe: o que mudou, os casos do plano e as dúvidas. */
export function changeBriefOf(props: {
  changed: IPendingChange;
  plan: ITestCase[];
  doubts: IPlanDoubt[];
  language: Language;
}): IChangeBrief {
  return {
    changes: props.changed.found,
    cases: props.plan.map((testCase) => ({
      id: testCase.id,
      title: testCase.title,
      priority: testCase.priority,
      goal: testCase.goal,
      preconditions: testCase.preconditions,
      steps: testCase.steps.map(({ action, expected, frame }) => ({
        action,
        expected,
        ...(frame === undefined ? {} : { frame }),
      })),
      sources: testCase.sources ?? [],
      ...(testCase.blockedBy === undefined ? {} : { blockedBy: testCase.blockedBy }),
    })),
    doubts: props.doubts,
    language: props.language,
  };
}
