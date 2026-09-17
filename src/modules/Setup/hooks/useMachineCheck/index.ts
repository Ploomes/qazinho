import { Machine } from '@/services';
import { useMachineStore, useSetupStore } from '@/store';

/** Looks at the machine again from scratch, and lands what it found where every screen reads it. */
export const useMachineCheck = () => {
  const isChecking = useSetupStore((state) => state.isChecking);
  const startChecking = useSetupStore((state) => state.startChecking);
  const landCheck = useSetupStore((state) => state.landCheck);
  const setAgents = useMachineStore((state) => state.setAgents);
  const setTools = useMachineStore((state) => state.setTools);

  return {
    isChecking,
    check: async () => {
      startChecking();

      const found = await Machine.check();

      setAgents(found.agents);
      setTools(found.tools);
      landCheck(found.managers);
    },
  };
};
