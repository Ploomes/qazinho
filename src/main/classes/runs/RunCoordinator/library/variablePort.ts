import type { IDevicePort } from '@/harness';
import type { IVariableValue } from '@/main/types';
import { hiddenValues } from './hiddenValues';
import { resolvedAction } from './resolvedAction';

/** The device as a run reaches it: a ${NAME} typed as its value, and every value that shows read back as its ${NAME}, in what it says, what it measures and why it failed. */
export function variablePort(props: {
  device: IDevicePort;
  values: IVariableValue[];
}): IDevicePort {
  const { device, values } = props;
  const hidden = (reason: unknown) =>
    new Error(
      hiddenValues({
        text: reason instanceof Error ? reason.message : String(reason),
        values,
      }),
    );

  return {
    describe: async () => {
      try {
        return hiddenValues({ text: await device.describe(), values });
      } catch (reason) {
        throw hidden(reason);
      }
    },
    inspect: async (target) => {
      try {
        return hiddenValues({ text: await device.inspect(target), values });
      } catch (reason) {
        throw hidden(reason);
      }
    },
    glance: () => device.glance(),
    motion: () => device.motion(),
    act: async (action) => {
      try {
        await device.act(resolvedAction({ action, values }));
      } catch (reason) {
        throw hidden(reason);
      }
    },
  };
}
