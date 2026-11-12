import type { IAgentEvent } from '@/shared/types';
import { useEffect, useEffectEvent, useRef } from 'react';
import { Agent, Assistant, Builds, Integrations, Machine, Run, Setup } from '@/services';
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
  const noteActivity = useWorkspaceStore((state) => state.noteActivity);
  const setRetry = useWorkspaceStore((state) => state.setRetry);
  const setReadStep = useWorkspaceStore((state) => state.setReadStep);
  const setLooking = useWorkspaceStore((state) => state.setLooking);
  const setChatDevice = useWorkspaceStore((state) => state.setChatDevice);
  const setContext = useWorkspaceStore((state) => state.setContext);
  const followInstall = useSetupStore((state) => state.followInstall);
  const setIntegrations = useSetupStore((state) => state.setIntegrations);
  const limitsAt = useRef(0);
  const workingAt = useRef(0);

  const hear = useEffectEvent((event: IAgentEvent) => {
    workingAt.current = Date.now();

    if (event.kind === 'usage' && event.hasLimits) limitsAt.current = Date.now();
  });
  const work = useEffectEvent(() => {
    workingAt.current = Date.now();
  });

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
        hear(event);

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
        } else if (event.kind === 'device') {
          setChatDevice({
            workspaceId: event.workspaceId,
            streamUrl: event.streamUrl,
            address: event.address,
          });
        } else if (event.kind === 'tool') {
          noteActivity({
            workspaceId: event.workspaceId,
            tool: event.tool,
            target: event.target,
          });
        } else if (event.kind === 'text')
          setLiveText({ workspaceId: event.workspaceId, text: event.text });
      }),
    [
      setUsage,
      setContext,
      setLiveText,
      noteActivity,
      setRetry,
      setReadStep,
      setLooking,
      setChatDevice,
    ],
  );

  useEffect(() => {
    const offs = [
      Assistant.onEvent((event) => {
        hear(event);
      }),
      Builds.onEvent(() => {
        work();
      }),
      Run.onEvent(() => {
        work();
      }),
    ];

    return () => {
      for (const off of offs) off();
    };
  }, []);

  useEffect(() => {
    if (agentId === null) return;

    const read = () => {
      limitsAt.current = Date.now();
      void Agent.limits(agentId).then((limits) => {
        if (limits !== null) setLimits(limits);
      });
    };
    const tick = () => {
      const now = Date.now();
      const isWorking = now - workingAt.current < MACHINE_WATCH.workingMs;
      const wait = isWorking ? MACHINE_WATCH.limitsWorkingMs : MACHINE_WATCH.limitsMs;

      if (now - limitsAt.current >= wait) read();
    };

    read();
    const id = window.setInterval(tick, MACHINE_WATCH.limitsTickMs);

    return () => {
      window.clearInterval(id);
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
