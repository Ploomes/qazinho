import type { ICorpusFile } from '@/harness/context/types';
import type { IHarnessTools } from '@/harness/tools/types';
import type { AppLook, HarnessRole, IHarnessTarget } from '@/harness/types';
import type {
  IChatAnswer,
  IChatReference,
  IFlatStep,
  ITargetUnderTest,
  IViewport,
  Language,
} from '@/shared/types';
import { LANGUAGE_NAMES } from '@/harness/constants';
import { CORPUS } from '@/harness/context/constants';
import {
  changedSections,
  chatMessageOf,
  describeCase,
  describeLook,
  describePlan,
  describeReferences,
  describeRuns,
  describeSize,
  fillSections,
  renderSections,
  sectionsFor,
} from '@/harness/context/library';
import { readChatAnswer } from '@/harness/library';
import { CHAT_SCHEMA } from '@/harness/schemas';
import { MCP_HOST, TOOL_GRANTS } from '@/harness/tools/constants';
import { toolsOfRole } from '@/harness/tools/library';

/** QAzinho's product harness: what the QA's agent is told, and which of QAzinho's tools it gets. */
export class Harness {
  private readonly corpus: readonly ICorpusFile[];

  public constructor(corpus: readonly ICorpusFile[] = CORPUS) {
    this.corpus = corpus;
  }

  /** The system prompt for a target: the corpus it reads, with this call's values filled in. */
  public contextFor(props: {
    target: IHarnessTarget;
    values?: Record<string, string>;
  }): string {
    const sections = sectionsFor({ corpus: this.corpus, target: props.target });

    return renderSections(fillSections({ sections, values: props.values ?? {} }));
  }

  /** The tools a role may call; a role with none runs with every tool taken away. */
  public toolsFor(role: HarnessRole): IHarnessTools {
    return toolsOfRole({ grants: TOOL_GRANTS, role, server: MCP_HOST.name });
  }

  /** One chat message: the corpus as its system prompt, and the QA's words opened by what the agent has not been told yet. */
  public chat(props: {
    text: string;
    told: Record<string, string>;
    target: ITargetUnderTest | null;
    viewport: IViewport | null;
    steps: IFlatStep[];
    references: IChatReference[];
    runs: IChatReference[];
    look: AppLook | null;
  }): {
    systemPrompt: string;
    prompt: string;
    told: Record<string, string>;
    schema: string;
    tools: IHarnessTools;
  } {
    const news = changedSections({
      sections: [
        {
          title: 'This workspace',
          lines: [
            props.target === null
              ? 'The workspace has no app to test yet.'
              : `The app under test is ${props.target.kind}: ${props.target.value}.`,
            ...describeSize(props.viewport),
            ...describePlan(props.steps),
          ],
        },
        describeRuns(props.runs),
        describeLook(props.look),
      ],
      told: props.told,
    });

    return {
      systemPrompt: this.contextFor({ target: { role: 'chat' } }),
      prompt: chatMessageOf({
        sections: [...news.changed, describeReferences(props.references)],
        text: props.text,
      }),
      told: news.told,
      schema: CHAT_SCHEMA,
      tools: this.toolsFor('chat'),
    };
  }

  /** The chat answer out of what the agent printed, checked against the schema it was asked for. */
  public readChat(text: string): IChatAnswer | null {
    return readChatAnswer(text);
  }

  /** The system prompt of a run on one device, in the language the QA reads; a browser also gets the window size. */
  public run(props: {
    target: ITargetUnderTest;
    viewport: IViewport;
    language: Language;
  }): string {
    return this.contextFor({
      target: { role: 'runner', platform: props.target.kind },
      values: {
        app: props.target.value,
        viewport: `${String(props.viewport.width)} × ${String(props.viewport.height)}`,
        language: LANGUAGE_NAMES[props.language],
      },
    });
  }

  /** The message that starts the agent's turn on one case, in the language the QA reads. */
  public walk(props: {
    steps: IFlatStep[];
    screen: string;
    language: Language;
    filed: string[];
  }): string {
    return describeCase(props);
  }
}
