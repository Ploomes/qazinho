import type { IDevicePort } from '@/harness';
import type { IStepAction } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { variablePort } from '@/main/classes/runs/RunCoordinator/library';

const VALUES = [{ name: 'LOGIN_PASSWORD', description: '', value: 'Sup3r-s3cret' }];

/** A device that keeps what it was asked to type, shows a page that echoes it, and fails when told to. */
function fakeDevice(failing = false) {
  const typed: IStepAction[] = [];
  const device: IDevicePort = {
    describe: () => Promise.resolve(`[field] Password: ${typed.at(-1)?.value ?? ''}`),
    glance: () => Promise.resolve(null),
    motion: () => Promise.resolve(null),
    act: (action) => {
      typed.push(action);

      return failing
        ? Promise.reject(new Error(`Nothing took "${action.value}".`))
        : Promise.resolve();
    },
  };

  return { device, typed };
}

describe('variablePort', () => {
  it('types the value on the device, and shows the agent the variable instead', async () => {
    const { device, typed } = fakeDevice();
    const port = variablePort({ device, values: VALUES });

    await port.act({ kind: 'fill', target: 'Password', value: '${LOGIN_PASSWORD}' });

    expect(typed).toEqual([{ kind: 'fill', target: 'Password', value: 'Sup3r-s3cret' }]);
    expect(await port.describe()).toBe('[field] Password: ${LOGIN_PASSWORD}');
  });

  it('does NOT say a value in why an action failed', async () => {
    const port = variablePort({ device: fakeDevice(true).device, values: VALUES });

    await expect(
      port.act({ kind: 'fill', target: 'Password', value: '${LOGIN_PASSWORD}' }),
    ).rejects.toThrow('Nothing took "${LOGIN_PASSWORD}".');
  });

  it('does NOT reach the device for a variable the project does not keep', async () => {
    const { device, typed } = fakeDevice();

    await expect(
      variablePort({ device, values: VALUES }).act({
        kind: 'fill',
        target: 'Email',
        value: '${LOGIN_EMAIL}',
      }),
    ).rejects.toThrow('no variable called ${LOGIN_EMAIL}');
    expect(typed).toEqual([]);
  });
});
