import type { IChatReference, IFlatStep, ITargetUnderTest } from '@/types';
import { CHAT_SCHEMA, DEVICE_BRIEF, HARNESS_SECTIONS } from './constants';
import {
  describeCase,
  describePlan,
  describeReferences,
  renderSections,
} from './library';

/** What QAzinho says to the QA's agent: the system prompt, the message and the answer's shape. */
export class Harness {
  public chat(props: {
    target: ITargetUnderTest | null;
    steps: IFlatStep[];
    references: IChatReference[];
  }): {
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
        describeReferences(props.references),
      ]),
      schema: CHAT_SCHEMA,
    };
  }

  public run(target: ITargetUnderTest): string {
    return renderSections([
      HARNESS_SECTIONS.identity,
      HARNESS_SECTIONS.testing,
      HARNESS_SECTIONS.run,
      {
        title: 'The device',
        lines: [...DEVICE_BRIEF[target.kind], `The app under test is ${target.value}.`],
      },
    ]);
  }

  public walk(props: { steps: IFlatStep[]; screen: string }): string {
    return describeCase(props);
  }
}
