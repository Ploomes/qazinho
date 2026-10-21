import type { BuildPlatform, IRepositoryRef } from '@/shared/types';
import { Builds } from '@/services';
import { useBuildStore, useMachineStore, useSettingsStore } from '@/store';

export const useBuildActions = () => {
  const startBuild = useBuildStore((state) => state.startBuild);
  const followBuild = useBuildStore((state) => state.followBuild);

  return {
    startBuild: (props: {
      projectId: string | null;
      platform: BuildPlatform;
      repository: IRepositoryRef;
      branch: string;
    }): string => {
      const buildId = `b-${crypto.randomUUID().slice(0, 8)}`;
      const { agent, model, language } = useSettingsStore.getState();
      const agentId =
        useMachineStore.getState().agents.find(({ name }) => name === agent)?.id ??
        'claude-code';

      startBuild({
        id: buildId,
        projectId: props.projectId,
        platform: props.platform,
        repository: `${props.repository.owner}/${props.repository.name}`,
        branch: props.branch,
        startedAt: Date.now(),
        phase: 'working',
        step: 'code',
        bytes: 0,
        lines: [],
        result: null,
      });

      void Builds.start({
        buildId,
        projectId: props.projectId,
        platform: props.platform,
        repository: props.repository,
        branch: props.branch,
        agentId,
        model,
        language,
      }).then((result) => {
        followBuild({ kind: 'ended', buildId, result });
      });

      return buildId;
    },
    stopBuild: (buildId: string) => {
      void Builds.stop(buildId);
    },
  };
};
