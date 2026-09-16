import { useEffect } from 'react';
import { MACHINE_WATCH } from '@/hooks/useMachineWatch/constants';
import { Agent, Machine } from '@/services';
import { useMachineStore, useWorkspaceStore } from '@/store';

/** Detection runs once; the meters keep reading, because a device can come up at any time. */
export const useMachineWatch = () => {
  const setAgents = useMachineStore((state) => state.setAgents);
  const setResources = useMachineStore((state) => state.setResources);
  const setTools = useMachineStore((state) => state.setTools);
  const setUsage = useMachineStore((state) => state.setUsage);
  const setLiveText = useWorkspaceStore((state) => state.setLiveText);
  const setContext = useWorkspaceStore((state) => state.setContext);

  useEffect(() => {
    void Machine.detectAgents().then(setAgents);
  }, [setAgents]);

  useEffect(() => {
    void Machine.detectDeviceTools().then(setTools);
  }, [setTools]);

  useEffect(
    () =>
      Agent.onEvent((event) => {
        if (event.kind === 'usage') {
          setUsage(event.usage);
          setContext({
            workspaceId: event.workspaceId,
            tokens: event.usage.contextTokens,
            window: event.usage.contextWindow,
          });
        } else setLiveText(event.text);
      }),
    [setUsage, setContext, setLiveText],
  );

  useEffect(() => {
    const read = () => {
      void Machine.readResources().then(setResources);
    };

    read();
    const id = window.setInterval(read, MACHINE_WATCH.pollMs);

    return () => {
      window.clearInterval(id);
    };
  }, [setResources]);
};
