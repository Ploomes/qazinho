import { useEffect } from 'react';
import { MACHINE_WATCH } from '@/hooks/useMachineWatch/constants';
import { Machine } from '@/services';
import { useMachineStore } from '@/store';

/** Detection runs once; the meters keep reading, because a device can come up at any time. */
export const useMachineWatch = () => {
  const setAgents = useMachineStore((state) => state.setAgents);
  const setResources = useMachineStore((state) => state.setResources);
  const setTools = useMachineStore((state) => state.setTools);

  useEffect(() => {
    void Machine.detectAgents().then(setAgents);
  }, [setAgents]);

  useEffect(() => {
    void Machine.detectDeviceTools().then(setTools);
  }, [setTools]);

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
