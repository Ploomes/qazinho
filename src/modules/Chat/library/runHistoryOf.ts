import type { IWorkspace } from '@/modules/Workspace';
import type { IChatReference } from '@/shared/types';
import { runFactsOf } from './runFactsOf';

const DEPTH = 5;

/** The workspace's latest runs for its chat agent, newest first: the last one whole with the notes its agent left, the ones before by what broke. */
export function runHistoryOf(props: {
  workspace: Pick<IWorkspace, 'runs' | 'chat'>;
  wholePlan: string;
}): IChatReference[] {
  const { workspace } = props;

  return workspace.runs.slice(0, DEPTH).map((run, index) => ({
    kind: 'run',
    id: run.id,
    title: `${props.wholePlan} · ${run.startedAt}`,
    facts: [
      ...runFactsOf({ run, isBrief: index > 0 }),
      ...(index === 0
        ? workspace.chat.flatMap((message) =>
            message.kind === 'note' && message.runId === run.id
              ? [`note: ${message.text}`]
              : [],
          )
        : []),
    ],
  }));
}
