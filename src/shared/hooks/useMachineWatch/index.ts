import { useEffect } from 'react';
import { Agent, Integrations, Machine, Setup } from '@/services';
import { MACHINE_WATCH } from '@/shared/hooks/useMachineWatch/constants';
import {
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useMachineWatch = () => {
  const setAgents = useMachineStore((state) => state.setAgents);
  const setResources = useMachineStore((state) => state.setResources);
  const setTools = useMachineStore((state) => state.setTools);
  const setUsage = useMachineStore((state) => state.setUsage);
  const setLimits = useMachineStore((state) => state.setLimits);
  const agentName = useSettingsStore((state) => state.agent);
  const agentId = useMachineStore(
    (state) => state.agents.find(({ name }) => name === agentName)?.id ?? null,
  );
  const setLiveText = useWorkspaceStore((state) => state.setLiveText);
  const setRetry = useWorkspaceStore((state) => state.setRetry);
  const setReadStep = useWorkspaceStore((state) => state.setReadStep);
  const setLooking = useWorkspaceStore((state) => state.setLooking);
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
        } else if (event.kind === 'code' || event.kind === 'jira') {
          setReadStep({
            workspaceId: event.workspaceId,
            step: event.step,
            bytes: event.bytes,
          });
        } else if (event.kind === 'look') {
          setLooking({ workspaceId: event.workspaceId, device: event.device });
        } else if (event.kind === 'text')
          setLiveText({ workspaceId: event.workspaceId, text: event.text });
      }),
    [setUsage, setContext, setLiveText, setRetry, setReadStep, setLooking],
  );

  useEffect(() => {
    if (agentId === null) return;

    let readAt = 0;
    const read = () => {
      readAt = Date.now();
      void Agent.limits(agentId).then((limits) => {
        if (limits !== null) setLimits(limits);
      });
    };
    const onFocus = () => {
      if (Date.now() - readAt >= MACHINE_WATCH.limitsFocusMs) read();
    };

    read();
    const id = window.setInterval(read, MACHINE_WATCH.limitsMs);

    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [agentId, setLimits]);

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
