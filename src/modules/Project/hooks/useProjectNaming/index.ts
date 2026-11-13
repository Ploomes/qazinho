import { useEffect, useRef } from 'react';
import { useNameProject } from '@/modules/Project/hooks/useNameProject';
import { nameSourcesOf } from '@/modules/Project/library';
import { Sites } from '@/services';
import { useAppStore } from '@/store';

export const useProjectNaming = () => {
  const projects = useAppStore((state) => state.projects);
  const nameAs = useNameProject();
  const tried = useRef(new Set<string>());
  const pending = projects
    .filter(({ isNamePending }) => isNamePending === true)
    .map((project) => ({ projectId: project.id, sources: nameSourcesOf(project) }))
    .filter(({ sources }) => sources.length > 0);

  useEffect(() => {
    for (const { projectId, sources } of pending) {
      const key = `${projectId}\n${JSON.stringify(sources)}`;

      if (tried.current.has(key)) continue;

      tried.current.add(key);
      void (async () => {
        for (const { source, from } of sources) {
          const name = await Sites.appName(source);

          if (name !== null) {
            nameAs({ projectId, name, from });

            return;
          }
        }
      })();
    }
  }, [pending, nameAs]);
};
