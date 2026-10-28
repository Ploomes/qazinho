import type { IProAccount } from '@/main/classes/pro/ProAccount';
import type { IProDeviceToken, ProAnswer } from '@/main/classes/pro/ProApi';
import type { IVaultCipher } from '@/main/types';
import type { IProOrg, ProSignInProgress } from '@/shared/types';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ProAccount } from '@/main/classes/pro/ProAccount';

/** Inverte o texto, para um teste distinguir um arquivo lacrado de um simples. */
function fakeCipher(isAvailable = true): IVaultCipher {
  return {
    isAvailable: () => isAvailable,
    encrypt: (plain) => Buffer.from([...plain].reverse().join('')),
    decrypt: (sealed) => [...sealed.toString()].reverse().join(''),
  };
}

const ORG: IProOrg = {
  slug: 'loja',
  name: 'Loja Online',
  role: 'editor',
  billingStatus: 'trialing',
};

const CONFIRMED: IProDeviceToken = {
  token: 'qzm_secret',
  machine: { id: 'm1', name: 'MacBook-Ana' },
  user: { id: 'u1', email: 'ana@loja.dev', name: 'Ana' },
  orgs: [ORG],
};

/**
 * A plataforma como a conta a chama: cada polling responde o próximo de `polls`, e `me`
 * responde `me`.
 */
function fakeApi(props: {
  polls?: ProAnswer<IProDeviceToken>[];
  me?: ProAnswer<{ user: IProDeviceToken['user']; orgs: IProOrg[] }>;
  code?: boolean;
}) {
  const polls = [...(props.polls ?? [{ isOk: true, value: CONFIRMED }])];
  const revoked: string[] = [];
  const api: IProAccount['api'] = {
    deviceCode: () =>
      Promise.resolve(
        props.code === false
          ? { isOk: false, status: 0, error: 'unreachable' }
          : {
              isOk: true,
              value: {
                deviceCode: 'dc',
                userCode: 'WDJB-MJHT',
                verificationUrl:
                  'https://qazinho.salvesoftware.com/device?code=WDJB-MJHT',
                expiresIn: 600,
                interval: 5,
              },
            },
      ),
    deviceToken: () =>
      Promise.resolve(
        polls.shift() ?? { isOk: false, status: 400, error: 'authorization_pending' },
      ),
    me: () =>
      Promise.resolve(
        props.me ?? {
          isOk: true,
          value: { user: CONFIRMED.user, orgs: CONFIRMED.orgs },
        },
      ),
    revokeMachine: ({ machineId }) => {
      revoked.push(machineId);

      return Promise.resolve({ isOk: true, value: null });
    },
  };

  return { api, revoked };
}

async function accountWith(props: {
  api: IProAccount['api'];
  cipher?: IVaultCipher;
  onWait?: () => void;
}) {
  const file = join(await mkdtemp(join(tmpdir(), 'qazinho-pro-')), 'pro.bin');
  const opened: string[] = [];
  const progress: ProSignInProgress[] = [];
  let clock = 0;
  const account = new ProAccount({
    api: props.api,
    cipher: props.cipher ?? fakeCipher(),
    file,
    machineName: 'MacBook-Ana',
    openUrl: (url) => {
      opened.push(url);

      return Promise.resolve();
    },
    wait: (ms) => {
      clock += ms;
      props.onWait?.();

      return Promise.resolve();
    },
    now: () => clock,
    onProgress: (moved) => {
      progress.push(moved);
    },
  });

  return { account, file, opened, progress };
}

describe('ProAccount', () => {
  it('signs in once the person confirms the code in the browser, and keeps the token sealed', async () => {
    const { api } = fakeApi({
      polls: [
        { isOk: false, status: 400, error: 'authorization_pending' },
        { isOk: true, value: CONFIRMED },
      ],
    });
    const { account, file, opened, progress } = await accountWith({ api });

    const ended = await account.signIn();

    expect(ended).toMatchObject({ phase: 'connected', account: 'ana@loja.dev' });
    expect(opened).toEqual(['https://qazinho.salvesoftware.com/device?code=WDJB-MJHT']);
    expect(
      progress.map((moved) => (moved.phase === 'working' ? moved.at : moved.phase)),
    ).toEqual(['code', 'browser', 'account', 'connected']);
    expect(progress[1]).toMatchObject({ code: 'WDJB-MJHT' });
    expect((await readFile(file)).toString()).not.toContain('qzm_secret');
    expect(await account.token()).toBe('qzm_secret');
  });

  it('stops when the person says no in the browser', async () => {
    const { api } = fakeApi({
      polls: [{ isOk: false, status: 403, error: 'access_denied' }],
    });
    const { account } = await accountWith({ api });

    expect(await account.signIn()).toMatchObject({
      phase: 'failed',
      at: 'browser',
      failure: 'denied',
    });
    expect(await account.token()).toBeNull();
  });

  it('says the code expired when nobody confirmed it in time', async () => {
    const { api } = fakeApi({ polls: [] });
    const { account } = await accountWith({ api });

    expect(await account.signIn()).toMatchObject({ phase: 'failed', failure: 'expired' });
  });

  it('keeps polling through a dropped connection', async () => {
    const { api } = fakeApi({
      polls: [
        { isOk: false, status: 0, error: 'unreachable' },
        { isOk: true, value: CONFIRMED },
      ],
    });
    const { account } = await accountWith({ api });

    expect(await account.signIn()).toMatchObject({ phase: 'connected' });
  });

  it('stops polling once the person cancels', async () => {
    const { api } = fakeApi({ polls: [] });
    let account: ProAccount | null = null;
    const built = await accountWith({
      api,
      onWait: () => {
        account?.cancelSignIn();
      },
    });
    account = built.account;

    expect(await account.signIn()).toMatchObject({ phase: 'cancelled' });
  });

  it('says the platform did not answer when there is no code to show', async () => {
    const { api } = fakeApi({ code: false });
    const { account } = await accountWith({ api });

    expect(await account.signIn()).toMatchObject({
      phase: 'failed',
      at: 'code',
      failure: 'unreachable',
    });
  });

  it('never asks for a code on a machine with no keychain to keep the token', async () => {
    const { api } = fakeApi({});
    const { account, opened } = await accountWith({ api, cipher: fakeCipher(false) });

    expect(await account.signIn()).toMatchObject({ failure: 'no-keychain' });
    expect(opened).toEqual([]);
    expect(await account.status()).toEqual({ isSignedIn: false, canKeepToken: false });
  });

  it('shows the account and its orgs as the platform answers them now', async () => {
    const renamed = {
      ...ORG,
      name: 'Loja Online S.A.',
      billingStatus: 'active' as const,
    };
    const { api } = fakeApi({
      me: { isOk: true, value: { user: CONFIRMED.user, orgs: [renamed] } },
    });
    const { account } = await accountWith({ api });
    await account.signIn();

    expect(await account.status()).toEqual({
      isSignedIn: true,
      account: { email: 'ana@loja.dev', name: 'Ana' },
      machine: { id: 'm1', name: 'MacBook-Ana' },
      orgs: [renamed],
      isReachable: true,
    });
  });

  it('keeps what it last knew, said as unreachable, when the platform does not answer', async () => {
    const { api } = fakeApi({ me: { isOk: false, status: 0, error: 'unreachable' } });
    const { account } = await accountWith({ api });
    await account.signIn();

    expect(await account.status()).toMatchObject({
      isSignedIn: true,
      orgs: [ORG],
      isReachable: false,
    });
  });

  it('forgets a token the platform no longer takes', async () => {
    const { api } = fakeApi({ me: { isOk: false, status: 401, error: 'unauthorized' } });
    const { account } = await accountWith({ api });
    await account.signIn();

    expect(await account.status()).toEqual({ isSignedIn: false, canKeepToken: true });
    expect(await account.token()).toBeNull();
  });

  it('keeps every org of the account, a project picking which it goes to', async () => {
    const outra = { ...ORG, slug: 'outra', name: 'Outra' };
    const leitura = { ...ORG, slug: 'leitura', role: 'reader' as const };
    const { api } = fakeApi({
      polls: [{ isOk: true, value: { ...CONFIRMED, orgs: [leitura, ORG, outra] } }],
      me: { isOk: true, value: { user: CONFIRMED.user, orgs: [leitura, ORG, outra] } },
    });
    const { account } = await accountWith({ api });

    await account.signIn();

    expect(await account.token()).toBe('qzm_secret');
    expect(await account.status()).toMatchObject({ orgs: [leitura, ORG, outra] });
    expect(await account.status()).not.toHaveProperty('orgSlug');
  });

  it('signs the machine out on the platform before forgetting its token', async () => {
    const { api, revoked } = fakeApi({});
    const { account } = await accountWith({ api });
    await account.signIn();

    expect(await account.signOut()).toEqual({ isSignedIn: false, canKeepToken: true });
    expect(revoked).toEqual(['m1']);
    expect(await account.token()).toBeNull();
  });
});
