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
        verificationUrl: 'https://qazinho.salvesoftware.com/device?code=WDJB-MJHT',
        expiresIn: 600,
        interval: 5,
      },
    });
    const api = new ProApi({
      baseUrl: 'https://qazinho-api.salvesoftware.com/',
      fetcher,
    });

    const answer = await api.deviceCode('MacBook-Ana');

    expect(answer.isOk).toBe(true);
    expect(calls).toEqual([
      {
        url: 'https://qazinho-api.salvesoftware.com/api/device/codes',
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
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.me('qzm_token');

    expect(answer).toEqual({ isOk: true, value: { user: USER, orgs: [ORG] } });
    expect(calls[0]?.headers).toEqual({ authorization: 'Bearer qzm_token' });
  });

  it('passes on the platform’s refusal while the person has not confirmed yet', async () => {
    const { fetcher } = fakePlatform({
      status: 400,
      body: { error: 'authorization_pending' },
    });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    expect(await api.deviceToken('dc')).toEqual({
      isOk: false,
      status: 400,
      error: 'authorization_pending',
    });
  });

  it('signs a machine out with nothing to read back', async () => {
    const { calls, fetcher } = fakePlatform({ status: 204, body: null });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.revokeMachine({ token: 'qzm_token', machineId: 'm/1' });

    expect(answer).toEqual({ isOk: true, value: null });
    expect(calls[0]?.url).toBe(
      'https://qazinho-api.salvesoftware.com/api/me/machines/m%2F1',
    );
  });

  it('deletes a project in its org by the id this computer keeps it under', async () => {
    const { calls, fetcher } = fakePlatform({ status: 204, body: null });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.deleteProject({
      token: 'qzm_token',
      org: 'loja',
      projectId: 'p 1',
    });

    expect(answer).toEqual({ isOk: true, value: null });
    expect(calls[0]).toMatchObject({
      url: 'https://qazinho-api.salvesoftware.com/api/orgs/loja/projects/p%201',
      method: 'DELETE',
      headers: { authorization: 'Bearer qzm_token' },
    });
  });

  it('puts a shared plan under its org’s sync, with the token as a bearer', async () => {
    const { calls, fetcher } = fakePlatform({
      status: 200,
      body: { plan: { id: 'plan-1', version: 2 } },
    });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.syncPlan({
      token: 'qzm_token',
      org: 'loja online',
      path: 'projects/p1/plans/w1',
      body: { name: 'Checkout', baseVersion: 1 },
    });

    expect(answer).toEqual({ isOk: true, value: { plan: { id: 'plan-1', version: 2 } } });
    expect(calls).toEqual([
      {
        url: 'https://qazinho-api.salvesoftware.com/api/orgs/loja%20online/projects/p1/plans/w1',
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer qzm_token',
        },
        body: '{"name":"Checkout","baseVersion":1}',
      },
    ]);
  });

  it('asks where to put a screen, by posting what it is', async () => {
    const { calls, fetcher } = fakePlatform({
      status: 201,
      body: {
        key: 'ev/1',
        uploadUrl: 'https://r2.test/ev/1',
        headers: { 'content-type': 'image/jpeg' },
      },
    });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.evidenceUpload({
      token: 'qzm_token',
      org: 'loja',
      path: 'evidence',
      body: { kind: 'screenshot', contentType: 'image/jpeg', size: 4, sha256: 'ab' },
    });

    expect(answer).toMatchObject({ isOk: true, value: { key: 'ev/1' } });
    expect(calls[0]).toMatchObject({
      url: 'https://qazinho-api.salvesoftware.com/api/orgs/loja/evidence',
      method: 'POST',
    });
  });

  it('replaces a plan’s recordings with nothing to read back', async () => {
    const { calls, fetcher } = fakePlatform({ status: 204, body: null });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.syncRecordings({
      token: 'qzm_token',
      org: 'loja',
      path: 'plans/plan-1/recordings',
      body: { branch: 'main', recordings: [] },
    });

    expect(answer).toEqual({ isOk: true, value: null });
    expect(calls[0]?.method).toBe('PUT');
  });

  it('reads the projects an org holds for download, its plans with what they say', async () => {
    const { calls, fetcher } = fakePlatform({
      status: 200,
      body: {
        projects: [
          {
            id: 'pp1',
            desktopId: 'p1',
            key: 'LOJA',
            name: 'Loja',
            targets: [
              { id: 't-web', kind: 'web', label: 'Web', value: 'https://loja.dev' },
            ],
            repositories: [],
            variables: [{ name: 'LOGIN_PASSWORD', description: 'senha' }],
            plans: [
              {
                id: 'plan-1',
                desktopId: 'w-1',
                name: 'Checkout',
                version: 3,
                targetKind: 'web',
                cases: [],
              },
            ],
          },
        ],
      },
    });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.syncedProjects({ token: 'qzm_token', org: 'loja' });

    expect(answer).toMatchObject({
      isOk: true,
      value: {
        projects: [{ desktopId: 'p1', plans: [{ desktopId: 'w-1', version: 3 }] }],
      },
    });
    expect(calls[0]).toMatchObject({
      url: 'https://qazinho-api.salvesoftware.com/api/orgs/loja/projects?include=plans',
      method: 'GET',
      headers: { authorization: 'Bearer qzm_token' },
    });
  });

  it('reads a plan’s recordings on a branch', async () => {
    const { calls, fetcher } = fakePlatform({
      status: 200,
      body: { branch: 'main', recordings: [] },
    });
    const api = new ProApi({ baseUrl: 'https://qazinho-api.salvesoftware.com', fetcher });

    const answer = await api.recordings({
      token: 'qzm_token',
      org: 'loja',
      planId: 'plan 1',
      branch: 'main',
    });

    expect(answer).toEqual({ isOk: true, value: { branch: 'main', recordings: [] } });
    expect(calls[0]?.url).toBe(
      'https://qazinho-api.salvesoftware.com/api/orgs/loja/plans/plan%201/recordings?branch=main',
    );
  });

  it('says the platform is unreachable when the call never answers', async () => {
    const api = new ProApi({
      baseUrl: 'https://qazinho-api.salvesoftware.com',
      fetcher: () => Promise.reject(new Error('offline')),
    });

    expect(await api.me('qzm_token')).toEqual({
      isOk: false,
      status: 0,
      error: 'unreachable',
    });
  });
});
