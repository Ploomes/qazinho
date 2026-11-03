import { useEffect } from 'react';
import { Updates } from '@/services';
import { useUpdateStore } from '@/store';

export const useUpdateWatch = () => {
  const setUpdate = useUpdateStore((state) => state.setUpdate);

  useEffect(() => {
    void Updates.state().then(setUpdate);

    return Updates.onChange(setUpdate);
  }, [setUpdate]);
};
