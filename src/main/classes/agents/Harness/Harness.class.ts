import type { IFlatStep, ITargetUnderTest } from '@/types';
import { CHAT_SCHEMA, DEVICE_BRIEF, HARNESS_SECTIONS, STEP_SCHEMA } from './constants';
import { describePlan, renderSections } from './library';

/** What gocrash says to the QA's agent: the system prompt, the message and the answer's shape. */
export class Harness {
  public chat(props: { target: ITargetUnderTest | null; steps: IFlatStep[] }): {
    systemPrompt: string;
    schema: string;
  } {
    return {
      systemPrompt: renderSections([
        HARNESS_SECTIONS.identity,
        HARNESS_SECTIONS.testing,
        HARNESS_SECTIONS.chat,
        {
          title: 'This workspace',
          lines: [
            props.target === null
              ? 'The workspace has no app to test yet.'
              : `The app under test is ${props.target.kind}: ${props.target.value}.`,
            ...describePlan(props.steps),
          ],
        },
      ]),
      schema: CHAT_SCHEMA,
    };
  }

  public run(target: ITargetUnderTest): { systemPrompt: string; schema: string } {
    return {
      systemPrompt: renderSections([
        HARNESS_SECTIONS.identity,
        HARNESS_SECTIONS.testing,
        HARNESS_SECTIONS.run,
        {
          title: 'The device',
          lines: [...DEVICE_BRIEF[target.kind], `The app under test is ${target.value}.`],
        },
      ]),
      schema: STEP_SCHEMA,
    };
  }

  public step(step: IFlatStep): string {
    return [
      `${step.caseId} · ${step.caseTitle}, step ${String(step.numberInCase)}.`,
      `Carry out: ${step.action}`,
      `The QA expects: ${step.expected}`,
    ].join('\n');
  }
}
