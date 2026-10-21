import { useEffect } from 'react';
import { Variables } from '@/services';
import { useAppStore, useVariablesStore } from '@/store';

export const useVariables = () => {
  const load = useVariablesStore((state) => state.load);

  useEffect(() => {
    void Variables.list().then(load);
  }, [load]);

  useEffect(
    () =>
      useAppStore.subscribe((state, before) => {
        if (!before.isLoaded || state.projects === before.projects) return;

        for (const gone of before.projects)
          if (!state.projects.some(({ id }) => id === gone.id)) {
            void Variables.forget(gone.id);
            useVariablesStore.getState().drop(gone.id);
          }
      }),
    [],
  );
};
