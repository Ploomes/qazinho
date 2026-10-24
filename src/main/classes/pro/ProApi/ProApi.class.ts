import type {
  IProApi,
  IProDeviceCode,
  IProDeviceToken,
  IProEvidenceUpload,
  IProMe,
  IProRequest,
  IProSyncCall,
  ProAnswer,
  ProFetcher,
} from './types';
import { z } from 'zod';
import {
  DEVICE_CODE_SCHEMA,
  DEVICE_TOKEN_SCHEMA,
  EVIDENCE_UPLOAD_SCHEMA,
  ME_SCHEMA,
  RECORDINGS_SCHEMA,
  SYNC_BUG_SCHEMA,
  SYNC_PLAN_SCHEMA,
  SYNC_PROJECT_SCHEMA,
  SYNC_RUN_SCHEMA,
  SYNCED_PROJECTS_SCHEMA,
} from './constants';
import { answerOf } from './library';

/** Talks to QAzinho Pro's API for this machine: its sign-in by a code the person confirms in the browser, the account it belongs to, and the sync of its shared projects. */
export class ProApi {
  private readonly baseUrl: string;
  private readonly fetcher: ProFetcher;

  public constructor(props: IProApi) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, '');
    this.fetcher = props.fetcher;
  }

  /** Asks the platform for a sign-in code for this machine. */
  public async deviceCode(machineName: string): Promise<ProAnswer<IProDeviceCode>> {
    return this.call({
      request: { method: 'POST', path: '/api/device/codes', body: { machineName } },
      schema: DEVICE_CODE_SCHEMA,
    });
  }

  /** Trades a sign-in code for this machine's token once the person confirmed it; `authorization_pending` until then. */
  public async deviceToken(deviceCode: string): Promise<ProAnswer<IProDeviceToken>> {
    return this.call({
      request: { method: 'POST', path: '/api/device/tokens', body: { deviceCode } },
      schema: DEVICE_TOKEN_SCHEMA,
    });
  }

  /** The account a token belongs to, and its orgs. */
  public async me(token: string): Promise<ProAnswer<IProMe>> {
    return this.call({
      request: { method: 'GET', path: '/api/me', token },
      schema: ME_SCHEMA,
    });
  }

  /** Signs a machine out: its token stops working. */
  public async revokeMachine(props: {
    token: string;
    machineId: string;
  }): Promise<ProAnswer<null>> {
    return this.call({
      request: {
        method: 'DELETE',
        path: `/api/me/machines/${encodeURIComponent(props.machineId)}`,
        token: props.token,
      },
      schema: z.null(),
    });
  }

  /** Sends a shared project: its name, targets, repositories and variable names. */
  public async syncProject(
    call: IProSyncCall,
  ): Promise<ProAnswer<z.infer<typeof SYNC_PROJECT_SCHEMA>>> {
    return this.put({ call, schema: SYNC_PROJECT_SCHEMA });
  }

  /** Sends a workspace's plan from the version it was based on; `plan_conflict` when the org moved it since. */
  public async syncPlan(
    call: IProSyncCall,
  ): Promise<ProAnswer<z.infer<typeof SYNC_PLAN_SCHEMA>>> {
    return this.put({ call, schema: SYNC_PLAN_SCHEMA });
  }

  public async syncRun(
    call: IProSyncCall,
  ): Promise<ProAnswer<z.infer<typeof SYNC_RUN_SCHEMA>>> {
    return this.put({ call, schema: SYNC_RUN_SCHEMA });
  }

  public async syncBug(
    call: IProSyncCall,
  ): Promise<ProAnswer<z.infer<typeof SYNC_BUG_SCHEMA>>> {
    return this.put({ call, schema: SYNC_BUG_SCHEMA });
  }

  /** Replaces a plan's recordings on a branch. */
  public async syncRecordings(call: IProSyncCall): Promise<ProAnswer<null>> {
    return this.put({ call, schema: z.null() });
  }

  /** The projects an org holds, each with its plans, for this machine to download. */
  public async syncedProjects(props: {
    token: string;
    org: string;
  }): Promise<ProAnswer<z.infer<typeof SYNCED_PROJECTS_SCHEMA>>> {
    return this.call({
      request: {
        method: 'GET',
        path: `/api/orgs/${encodeURIComponent(props.org)}/projects`,
        token: props.token,
      },
      schema: SYNCED_PROJECTS_SCHEMA,
    });
  }

  /** A plan's recordings on a branch, to walk its cases again without the agent. */
  public async recordings(props: {
    token: string;
    org: string;
    planId: string;
    branch: string;
  }): Promise<ProAnswer<z.infer<typeof RECORDINGS_SCHEMA>>> {
    const { token, org, planId, branch } = props;

    return this.call({
      request: {
        method: 'GET',
        path: `/api/orgs/${encodeURIComponent(org)}/plans/${encodeURIComponent(planId)}/recordings?branch=${encodeURIComponent(branch)}`,
        token,
      },
      schema: RECORDINGS_SCHEMA,
    });
  }

  /** Asks where to put one screenshot or video, signed for this machine for a short while. */
  public async evidenceUpload(
    call: IProSyncCall,
  ): Promise<ProAnswer<IProEvidenceUpload>> {
    return this.call({
      request: {
        method: 'POST',
        path: `/api/orgs/${encodeURIComponent(call.org)}/${call.path}`,
        body: call.body,
        token: call.token,
      },
      schema: EVIDENCE_UPLOAD_SCHEMA,
    });
  }

  private async put<T>(props: {
    call: IProSyncCall;
    schema: z.ZodType<T>;
  }): Promise<ProAnswer<T>> {
    const { call, schema } = props;

    return this.call({
      request: {
        method: 'PUT',
        path: `/api/orgs/${encodeURIComponent(call.org)}/${call.path}`,
        body: call.body,
        token: call.token,
      },
      schema,
    });
  }

  private async call<T>(props: {
    request: IProRequest;
    schema: z.ZodType<T>;
  }): Promise<ProAnswer<T>> {
    const { request, schema } = props;
    const headers: Record<string, string> = {};

    if (request.body !== undefined) headers['content-type'] = 'application/json';
    if (request.token !== undefined) headers.authorization = `Bearer ${request.token}`;

    try {
      const response = await this.fetcher(`${this.baseUrl}${request.path}`, {
        method: request.method,
        headers,
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      });

      return await answerOf({ response, schema });
    } catch {
      return { isOk: false, status: 0, error: 'unreachable' };
    }
  }
}
