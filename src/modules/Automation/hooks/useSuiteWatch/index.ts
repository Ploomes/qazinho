import { useEffect } from 'react';
import { Suites } from '@/services';
import { useAppStore, useSuiteStore } from '@/store';

export const useSuiteWatch = () => {
  const isLoaded = useAppStore((state) => state.isLoaded);
  const projectIds = useAppStore((state) => state.projects.map(({ id }) => id).join(' '));
  const putSuite = useSuiteStore((state) => state.putSuite);
  const putRuns = useSuiteStore((state) => state.putRuns);
  const hear = useSuiteStore((state) => state.hear);

  useEffect(() => {
    if (!isLoaded) return;

    for (const projectId of projectIds.split(' ').filter((id) => id !== ''))
      void Suites.of(projectId).then(async (suite) => {
        putSuite({ projectId, suite });

        if (suite !== null) putRuns({ projectId, runs: await Suites.runs(projectId) });
      });
  }, [isLoaded, projectIds, putSuite, putRuns]);

  useEffect(() => Suites.onEvent(hear), [hear]);

  useEffect(
    () =>
      useAppStore.subscribe((state, before) => {
        if (!before.isLoaded || state.projects === before.projects) return;

        for (const gone of before.projects)
          if (!state.projects.some(({ id }) => id === gone.id)) {
            void Suites.forget(gone.id);
            useSuiteStore.getState().drop(gone.id);
          }
      }),
    [],
  );
};
