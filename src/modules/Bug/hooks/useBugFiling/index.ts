import type { FilingChange, IBugFiling, IFilingPlan } from '@/modules/Bug/types';
import type { IssueTarget } from '@/shared/types';
import { useEffect, useRef, useState } from 'react';
import { useSendBug } from '@/modules/Bug/hooks/useSendBug';
import { filingAfter } from '@/modules/Bug/library';
import { Bugs } from '@/services';

export const useBugFiling = () => {
  const { send } = useSendBug();
  const [filing, setFiling] = useState<IBugFiling | null>(null);
  const asked = useRef<{
    workspaceId: string;
    bugId: string;
    target: IssueTarget;
    title: string;
    plan: IFilingPlan;
  } | null>(null);
  const filingId = filing?.filingId ?? null;

  useEffect(() => {
    if (filingId === null) return;

    return Bugs.onFiling((event) => {
      setFiling((current) =>
        current === null
          ? null
          : filingAfter({ filing: current, change: { kind: 'step', event } }),
      );
    });
  }, [filingId]);

  const start = (props: {
    workspaceId: string;
    bugId: string;
    target: IssueTarget;
    title: string;
    plan: IFilingPlan;
  }) => {
    const id = `f-${crypto.randomUUID().slice(0, 8)}`;
    const move = (change: FilingChange) => {
      setFiling((current) =>
        current?.filingId === id ? filingAfter({ filing: current, change }) : current,
      );
    };

    asked.current = props;
    setFiling({
      filingId: id,
      bugId: props.bugId,
      target: props.target,
      story: props.target.tracker === 'jira' ? (props.plan.story?.key ?? null) : null,
      shots: props.plan.shots.length,
      steps: props.plan.steps.map((row) => ({
        row,
        state: row === 'ready' ? 'working' : 'pending',
      })),
      result: null,
    });
    void send({
      filingId: id,
      workspaceId: props.workspaceId,
      bugId: props.bugId,
      target: props.target,
      title: props.title,
      onReady: () => {
        move({ kind: 'ready' });
      },
    }).then((result) => {
      move({ kind: 'ended', result });
    });
  };

  return {
    filing,
    start,
    retry: () => {
      if (asked.current !== null) start(asked.current);
    },
    close: () => {
      setFiling(null);
    },
  };
};
