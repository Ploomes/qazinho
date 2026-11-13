import { useEffect } from 'react';
import { Templates } from '@/services';
import { useTemplateStore } from '@/store';

export const useTemplates = () => {
  const setTemplates = useTemplateStore((state) => state.setTemplates);

  useEffect(() => {
    void Templates.list().then(setTemplates);
  }, [setTemplates]);
};
