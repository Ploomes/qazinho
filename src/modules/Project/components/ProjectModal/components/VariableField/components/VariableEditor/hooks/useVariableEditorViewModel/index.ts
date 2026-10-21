import { useEffect, useRef } from 'react';
import { VARIABLE_EDITOR } from '@/modules/Project/components/ProjectModal/components/VariableField/components/VariableEditor/constants';

export const useVariableEditorViewModel = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }, VARIABLE_EDITOR.scrollAfterMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return { ref };
};
