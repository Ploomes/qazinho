import type { ProFetcher } from '@/main/classes/pro/ProApi';
import { describe, expect, it } from 'vitest';
import { ProApi } from '@/main/classes/pro/ProApi';

/** A platform that answers every call with one status and body, and remembers what it was asked. */
function fakePlatform(answer: { status: number; body: unknown }) {
  const calls: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }[] = [];
  const fetcher: ProFetcher = (url, init) => {
    calls.push({ url, ...init });

    return Promise.resolve({
      ok: answer.status < 400,
      status: answer.status,
      text: () =>
        Promise.resolve(answer.body === null ? '' : JSON.stringify(answer.body)),
    });
  };

  return { calls, fetcher };
}

const ORG = {
  slug: 'loja',
  name: 'Loja Online',
  role: 'editor',
  billingStatus: 'active',
};
const USER = { id: 'u1', email: 'ana@loja.dev', name: 'Ana' };

describe('ProApi', () => {
  it('asks for a sign-in code with the machine’s name', async () => {
    const { calls, fetcher } = fakePlatform({
      status: 201,
      body: {
        deviceCode: 'dc',
        userCode: 'WDJB-MJHT',
        verificationUrl: 'https://app.qazinho.com/device?code=WDJB-MJHT',
        expiresIn: 600,
        interval: 5,
      },
    });
    const api = new ProApi({ baseUrl: 'https://api.qazinho.com/', fetcher });

    const answer = await api.deviceCode('MacBook-Ana');

    expect(answer.isOk).toBe(true);
    expect(calls).toEqual([
      {
        url: 'https://api.qazinho.com/device/codes',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"machineName":"MacBook-Ana"}',
      },
    ]);
  });

  it('reads the account a token belongs to, sending the token as a bearer', async () => {
    const { calls, fetcher } = fakePlatform({
      status: 200,
      body: { user: USER, orgs: [{ ...ORG, id: 'o1', trialEndsAt: null }] },
    });
    const api = new ProApi({ baseUrl: 'https://api.qazinho.com', fetcher });

    const answer = await api.me('qzm_token');

    expect(answer).toEqual({ isOk: true, value: { user: USER, orgs: [ORG] } });
    expect(calls[0]?.headers).toEqual({ authorization: 'Bearer qzm_token' });
  });

  it('passes on the platform’s refusal while the person has not confirmed yet', async () => {
    const { fetcher } = fakePlatform({
      status: 400,
      body: { error: 'authorization_pending' },
    });
    const api = new ProApi({ baseUrl: 'https://api.qazinho.com', fetcher });

    expect(await api.deviceToken('dc')).toEqual({
      isOk: false,
      status: 400,
      error: 'authorization_pending',
    });
  });

  it('signs a machine out with nothing to read back', async () => {
    const { calls, fetcher } = fakePlatform({ status: 204, body: null });
    const api = new ProApi({ baseUrl: 'https://api.qazinho.com', fetcher });

    const answer = await api.revokeMachine({ token: 'qzm_token', machineId: 'm/1' });

    expect(answer).toEqual({ isOk: true, value: null });
    expect(calls[0]?.url).toBe('https://api.qazinho.com/me/machines/m%2F1');
  });

  it('says the platform is unreachable when the call never answers', async () => {
    const api = new ProApi({
      baseUrl: 'https://api.qazinho.com',
      fetcher: () => Promise.reject(new Error('offline')),
    });

    expect(await api.me('qzm_token')).toEqual({
      isOk: false,
      status: 0,
      error: 'unreachable',
    });
  });
});
