import { useEffect } from 'react';
import { Agent, Integrations, Machine, Setup } from '@/services';
import { MACHINE_WATCH } from '@/shared/hooks/useMachineWatch/constants';
import { useMachineStore, useSetupStore, useWorkspaceStore } from '@/store';

export const useMachineWatch = () => {
  const setAgents = useMachineStore((state) => state.setAgents);
  const setResources = useMachineStore((state) => state.setResources);
  const setTools = useMachineStore((state) => state.setTools);
  const setUsage = useMachineStore((state) => state.setUsage);
  const setLiveText = useWorkspaceStore((state) => state.setLiveText);
  const setRetry = useWorkspaceStore((state) => state.setRetry);
  const setContext = useWorkspaceStore((state) => state.setContext);
  const followInstall = useSetupStore((state) => state.followInstall);
  const setIntegrations = useSetupStore((state) => state.setIntegrations);

  useEffect(() => {
    void Machine.detectAgents().then(setAgents);
  }, [setAgents]);

  useEffect(() => {
    void Machine.detectDeviceTools().then(setTools);
  }, [setTools]);

  useEffect(() => {
    void Integrations.list().then(setIntegrations);
  }, [setIntegrations]);

  useEffect(() => Setup.onEvent(followInstall), [followInstall]);

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
        } else if (event.kind === 'retry') {
          setRetry({
            workspaceId: event.workspaceId,
            attempt: event.attempt,
            maxRetries: event.maxRetries,
          });
        } else setLiveText({ workspaceId: event.workspaceId, text: event.text });
      }),
    [setUsage, setContext, setLiveText, setRetry],
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
