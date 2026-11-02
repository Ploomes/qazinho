import type { IOutsideServerProps } from '@/main/classes/assistant/OutsideServer/types';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OutsideServer } from '@/main/classes/assistant/OutsideServer';

/** Um host que abre a porta pedida, ou a 4100 para a porta 0, e que pode estar ocupado. */
function fakes(props: { isBusy?: boolean; holds?: string[] } = {}) {
  const added: { agentId: string; name: string; url: string }[] = [];
  const removed: { agentId: string; name: string }[] = [];
  const started: { port: number; token: string }[] = [];
  let address: string | null = null;
  const host: IOutsideServerProps['host'] = {
    start: ({ port, token }) => {
      started.push({ port, token });

      if (props.isBusy === true) return Promise.resolve({ isListening: false });

      const open = port === 0 ? 4100 : port;

      address = `http://127.0.0.1:${String(open)}/${token}/mcp`;

      return Promise.resolve({ isListening: true, port: open });
    },
    stop: () => {
      address = null;

      return Promise.resolve();
    },
    address: () => address,
  };
  const mcp: IOutsideServerProps['mcp'] = {
    holds: ({ url }) => Promise.resolve(props.holds?.includes(url) === true),
    addAddress: (server) => {
      added.push(server);

      return Promise.resolve({ ok: true });
    },
    removeName: (server) => {
      removed.push(server);

      return Promise.resolve({ ok: true });
    },
  };

  return { host, mcp, added, removed, started };
}

async function server(props: Parameters<typeof fakes>[0] = {}) {
  const made = fakes(props);
  const file = join(await mkdtemp(join(tmpdir(), 'qazinho-outside-')), 'outside.json');

  return {
    ...made,
    file,
    outside: new OutsideServer({
      file,
      host: made.host,
      mcp: made.mcp,
      agents: () =>
        Promise.resolve([
          { id: 'claude-code', name: 'Claude Code', isFound: true },
          { id: 'codex', name: 'Codex', isFound: false },
          { id: 'other', name: 'Other', isFound: true },
        ]) as never,
      perform: () => Promise.resolve({ text: '', isError: false }),
    }),
  };
}

describe('OutsideServer', () => {
  it('stays closed until the QA turns it on', async () => {
    const { outside, started } = await server();

    await outside.start();

    expect(outside.status()).toEqual({ isOn: false, isBusy: false });
    expect(outside.savedAddress()).toBeNull();
    expect(started).toEqual([]);
  });

  it('opens a free port once on, and keeps the address only its owner reads', async () => {
    const { outside, file, started } = await server();

    expect(await outside.turn(true)).toEqual({ isOn: true, isBusy: false });
    expect(started[0]?.port).toBe(0);

    const saved = JSON.parse(await readFile(file, 'utf8')) as { port: number };

    expect(saved.port).toBe(4100);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  /** O agente do QA guarda o endereço: mudá-lo a cada abertura o deixaria apontando para o nada. */
  it('comes back on the same address when the app opens again', async () => {
    const first = await server();

    await first.outside.turn(true);

    const address = first.outside.savedAddress();
    const again = fakes();
    const outside = new OutsideServer({
      file: first.file,
      host: again.host,
      mcp: again.mcp,
      agents: () => Promise.resolve([]),
      perform: () => Promise.resolve({ text: '', isError: false }),
    });

    await outside.start();

    expect(outside.status().isOn).toBe(true);
    expect(outside.savedAddress()).toBe(address);
  });

  it('keeps the address when turned off, and returns to it', async () => {
    const { outside, started } = await server();

    await outside.turn(true);

    const address = outside.savedAddress();

    expect(await outside.turn(false)).toEqual({ isOn: false, isBusy: false });
    expect(outside.savedAddress()).toBe(address);

    await outside.turn(true);

    expect(started[1]?.port).toBe(4100);
    expect(outside.savedAddress()).toBe(address);
  });

  it('says the port is busy instead of failing the app', async () => {
    const { outside } = await server({ isBusy: true });

    expect(await outside.turn(true)).toEqual({ isOn: true, isBusy: true });
  });

  it('lists the agents found that it knows how to set up, and which hold the address', async () => {
    const { outside } = await server();

    await outside.turn(true);

    expect(await outside.agentsHere()).toEqual([
      { id: 'claude-code', name: 'Claude Code', isAdded: false },
    ]);
  });

  it('adds the server under the name that shadows it inside QAzinho own calls', async () => {
    const { outside, added, removed } = await server();

    await outside.turn(true);
    await outside.addTo('claude-code');
    await outside.removeFrom('claude-code');

    expect(added).toEqual([
      { agentId: 'claude-code', name: 'qazinho', url: outside.savedAddress() },
    ]);
    expect(removed).toEqual([{ agentId: 'claude-code', name: 'qazinho' }]);
  });

  it('refuses to add an address it does not have yet', async () => {
    const { outside, added } = await server();

    expect((await outside.addTo('claude-code')).ok).toBe(false);
    expect(added).toEqual([]);
  });

  it('takes a new address to the agents that held the old one', async () => {
    const made = await server();

    await made.outside.turn(true);

    const old = made.outside.savedAddress() ?? '';
    const again = fakes({ holds: [old] });
    const outside = new OutsideServer({
      file: made.file,
      host: again.host,
      mcp: again.mcp,
      agents: () =>
        Promise.resolve([
          { id: 'claude-code', name: 'Claude Code', isFound: true },
        ]) as never,
      perform: () => Promise.resolve({ text: '', isError: false }),
    });

    await outside.start();
    await outside.renew();

    expect(outside.savedAddress()).not.toBe(old);
    expect(again.added).toEqual([
      { agentId: 'claude-code', name: 'qazinho', url: outside.savedAddress() },
    ]);
  });

  it('starts closed from a file it cannot read', async () => {
    const { outside, file } = await server();

    await writeFile(file, 'not json');
    await outside.start();

    expect(outside.status().isOn).toBe(false);
  });
});
