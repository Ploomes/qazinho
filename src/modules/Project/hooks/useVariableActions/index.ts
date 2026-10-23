import type { IVariableBrief, VariableChange, VariablesOutcome } from '@/shared/types';
import { planWithVariableRenamed } from '@/modules/Plan/library';
import { Variables } from '@/services';
import { useVariablesStore, useWorkspaceStore } from '@/store';

export const useVariableActions = () => {
  const applyVariables = async (props: {
    projectId: string;
    changes: VariableChange[];
  }): Promise<VariablesOutcome> => {
    const outcome = await Variables.apply(props);

    if (!outcome.isSaved) return outcome;

    useVariablesStore
      .getState()
      .land({ projectId: props.projectId, variables: outcome.variables });

    for (const change of props.changes) {
      if (change.kind !== 'save' || change.from === null || change.from === change.name)
        continue;

      const { from, name } = change;

      for (const workspace of useWorkspaceStore.getState().workspaces) {
        if (workspace.projectId !== props.projectId) continue;

        const plan = planWithVariableRenamed({ plan: workspace.plan, from, to: name });

        if (JSON.stringify(plan) !== JSON.stringify(workspace.plan))
          useWorkspaceStore.getState().setPlan({ workspaceId: workspace.id, plan });
      }
    }

    return outcome;
  };

  const askVariables = (props: {
    projectId: string;
    drafts: IVariableBrief[];
    waitMs?: number;
    by?: 'agent' | 'plan';
  }): Promise<string[] | null> =>
    new Promise((settle) => {
      const id = crypto.randomUUID();
      const late =
        props.waitMs === undefined
          ? null
          : window.setTimeout(() => {
              useVariablesStore.getState().settle({ id, saved: null });
            }, props.waitMs);
      const stop = useVariablesStore.subscribe((state) => {
        if (state.settled?.id !== id) return;

        stop();

        if (late !== null) window.clearTimeout(late);

        settle(state.settled.saved);
      });

      useVariablesStore.getState().ask({
        id,
        projectId: props.projectId,
        drafts: props.drafts,
        ...(props.by === undefined ? {} : { by: props.by }),
      });
    });

  return { applyVariables, askVariables };
};
