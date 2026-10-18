import type { ICorpusFile, IHarnessSection } from '@/harness/context/types';
import type { IHarnessTools } from '@/harness/tools/types';
import type { AppLook, HarnessRole, IHarnessTarget } from '@/harness/types';
import type {
  IChatAnswer,
  IChatReference,
  IFlatStep,
  ITargetUnderTest,
  IViewport,
} from '@/shared/types';
import { CORPUS } from '@/harness/context/constants';
import {
  describeCase,
  describeLook,
  describePlan,
  describeReferences,
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

  /** The system prompt for a target: the corpus it reads, then what this call adds on top. */
  public contextFor(props: {
    target: IHarnessTarget;
    values?: Record<string, string>;
    volatile?: IHarnessSection[];
  }): string {
    const sections = sectionsFor({ corpus: this.corpus, target: props.target });

    return renderSections([
      ...fillSections({ sections, values: props.values ?? {} }),
      ...(props.volatile ?? []),
    ]);
  }

  /** The tools a role may call; a role with none runs with every tool taken away. */
  public toolsFor(role: HarnessRole): IHarnessTools {
    return toolsOfRole({ grants: TOOL_GRANTS, role, server: MCP_HOST.name });
  }

  /** One chat message: the workspace, what QAzinho saw of the app and what the QA pointed at, and the answer's shape. */
  public chat(props: {
    target: ITargetUnderTest | null;
    steps: IFlatStep[];
    references: IChatReference[];
    look: AppLook | null;
  }): {
    systemPrompt: string;
    schema: string;
    tools: IHarnessTools;
  } {
    return {
      systemPrompt: this.contextFor({
        target: { role: 'chat' },
        volatile: [
          {
            title: 'This workspace',
            lines: [
              props.target === null
                ? 'The workspace has no app to test yet.'
                : `The app under test is ${props.target.kind}: ${props.target.value}.`,
              ...describePlan(props.steps),
            ],
          },
          describeLook(props.look),
          describeReferences(props.references),
        ],
      }),
      schema: CHAT_SCHEMA,
      tools: this.toolsFor('chat'),
    };
  }

  /** The chat answer out of what the agent printed, checked against the schema it was asked for. */
  public readChat(text: string): IChatAnswer | null {
    return readChatAnswer(text);
  }

  /** The system prompt of a run on one device; a browser also gets the window size it opens at. */
  public run(props: { target: ITargetUnderTest; viewport: IViewport }): string {
    return this.contextFor({
      target: { role: 'runner', platform: props.target.kind },
      values: {
        app: props.target.value,
        viewport: `${String(props.viewport.width)} × ${String(props.viewport.height)}`,
      },
    });
  }

  /** The message that starts the agent's turn on one case. */
  public walk(props: { steps: IFlatStep[]; screen: string }): string {
    return describeCase(props);
  }
}
