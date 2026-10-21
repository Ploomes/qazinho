import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { withBuiltTarget } from '@/modules/Build/library';
import { PLATFORM_LABEL } from '@/modules/Workspace';
import { Builds } from '@/services';
import { useAppStore, useBuildStore } from '@/store';

export const useBuildEvents = () => {
  const { t } = useTranslation();
  const followBuild = useBuildStore((state) => state.followBuild);

  useEffect(
    () =>
      Builds.onEvent((event) => {
        followBuild(event);

        if (event.kind !== 'ended' || !event.result.isBuilt) return;

        const build = useBuildStore
          .getState()
          .builds.find(({ id }) => id === event.buildId);
        const project = useAppStore
          .getState()
          .projects.find(({ id }) => id === build?.projectId);

        if (build === undefined || project === undefined) return;

        useAppStore.getState().putProject(
          withBuiltTarget({
            project,
            platform: build.platform,
            artifact: event.result.artifact,
            label: t(PLATFORM_LABEL[build.platform]),
          }),
        );
      }),
    [followBuild, t],
  );
};
