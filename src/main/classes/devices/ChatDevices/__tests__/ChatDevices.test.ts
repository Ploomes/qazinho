import type { IDeviceDriver } from '@salve-software/qazinho-harness/engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatDevices } from '@/main/classes/devices/ChatDevices';

/** Um Chrome falso que conta quantas vezes abriu e fechou, e manda um frame ao transmitir. */
function world() {
  const opened: string[] = [];
  const closed: string[] = [];
  const changes: {
    workspaceId: string;
    streamUrl: string | null;
    address: string | null;
  }[] = [];
  const ended: string[] = [];
  let addressOf: ((url: string) => void) | null = null;
  const devices = new ChatDevices({
    profilesRoot: '/data/profiles',
    idleMs: 1_000,
    openDriver: ({ url, profileDir, onAddress }) => {
      addressOf = onAddress;
      opened.push(`${url} ${profileDir}`);

      return {
        open: () => Promise.resolve(),
        stream: (onFrame: (jpeg: Buffer) => void) => {
          onFrame(Buffer.from('frame'));

          return Promise.resolve(true);
        },
        close: () => {
          closed.push(url);

          return Promise.resolve();
        },
      } as unknown as IDeviceDriver;
    },
    live: {
      push: () => undefined,
      urlFor: (key) => `http://127.0.0.1:9/${key}`,
      end: (key) => {
        ended.push(key);
      },
    },
    onChange: (change) => changes.push(change),
  });

  return {
    devices,
    opened,
    closed,
    changes,
    ended,
    address: (url: string) => addressOf?.(url),
  };
}

const READY = {
  workspaceId: 'w1',
  url: 'http://localhost:8000',
  values: [{ name: 'SHOP_PASSWORD', description: '', value: 'Sup3r' }],
  viewport: { width: 1280, height: 800 },
};

afterEach(() => {
  vi.useRealTimers();
});

describe('ChatDevices', () => {
  it("opens the workspace's own browser for the chat and streams it apart from a run", async () => {
    const { devices, opened, changes } = world();

    await devices.ready(READY);

    expect(opened).toEqual(['http://localhost:8000 /data/profiles/chat-w1']);
    expect(changes.at(-1)).toEqual({
      workspaceId: 'w1',
      streamUrl: 'http://127.0.0.1:9/chat~w1',
      address: null,
    });
  });

  it('keeps the browser between messages, so the agent stays logged in', async () => {
    const { devices, opened } = world();

    await devices.ready(READY);
    devices.release('w1');
    await devices.ready(READY);

    expect(opened).toHaveLength(1);
  });

  it('closes a browser nobody came back to', async () => {
    vi.useFakeTimers();

    const { devices, closed, ended, changes } = world();

    await devices.ready(READY);
    devices.release('w1');
    await vi.advanceTimersByTimeAsync(1_000);

    expect(closed).toEqual(['http://localhost:8000']);
    expect(ended).toEqual(['chat~w1']);
    expect(changes.at(-1)).toEqual({ workspaceId: 'w1', streamUrl: null, address: null });
  });

  it('shows where the tab went, a value typed in the address written as its name', async () => {
    const { devices, changes, address } = world();

    await devices.ready(READY);
    address('http://localhost:8000/u/Sup3r/edit');

    expect(changes.at(-1)?.address).toBe('http://localhost:8000/u/${SHOP_PASSWORD}/edit');
  });

  it('opens a new browser when the app moved to another address', async () => {
    const { devices, opened, closed } = world();

    await devices.ready(READY);
    await devices.ready({ ...READY, url: 'http://localhost:9000' });

    expect(closed).toEqual(['http://localhost:8000']);
    expect(opened).toHaveLength(2);
  });

  it('closes everything when the app quits', async () => {
    const { devices, closed } = world();

    await devices.ready(READY);
    await devices.ready({ ...READY, workspaceId: 'w2' });
    await devices.closeAll();

    expect(closed).toHaveLength(2);
  });
});
