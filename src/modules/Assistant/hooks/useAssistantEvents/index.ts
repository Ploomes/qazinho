import { useEffect } from 'react';
import { Assistant } from '@/services';
import { useAssistantStore, useMachineStore } from '@/store';

export const useAssistantEvents = () => {
  const setLiveText = useAssistantStore((state) => state.setLiveText);
  const setUsage = useMachineStore((state) => state.setUsage);

  useEffect(
    () =>
      Assistant.onEvent((event) => {
        if (event.kind === 'text') setLiveText(event.text);
        else if (event.kind === 'usage') setUsage(event.usage);
      }),
    [setLiveText, setUsage],
  );
};
