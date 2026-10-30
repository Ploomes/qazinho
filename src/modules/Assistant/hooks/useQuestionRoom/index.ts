import { useEffect } from 'react';
import { useAssistantStore, useWorkspaceStore } from '@/store';

/** Fecha o chat do Estagiário quando uma run pergunta ao QA, para não cobri-la. */
export const useQuestionRoom = () => {
  const close = useAssistantStore((state) => state.close);
  const asking = useWorkspaceStore((state) =>
    state.workspaces
      .filter(({ live }) => live !== null && !live.isDone && live.question !== undefined)
      .map(({ id, live }) => `${id}/${live?.question?.id ?? ''}`)
      .join(','),
  );

  useEffect(() => {
    if (asking !== '') close();
  }, [asking, close]);
};
