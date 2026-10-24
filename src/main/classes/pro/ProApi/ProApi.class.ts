import type {
  IProApi,
  IProDeviceCode,
  IProDeviceToken,
  IProMe,
  IProRequest,
  ProAnswer,
  ProFetcher,
} from './types';
import { z } from 'zod';
import { DEVICE_CODE_SCHEMA, DEVICE_TOKEN_SCHEMA, ME_SCHEMA } from './constants';
import { answerOf } from './library';

/** Talks to QAzinho Pro's API for this machine: its sign-in by a code the person confirms in the browser, and the account it belongs to. */
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
      request: { method: 'POST', path: '/device/codes', body: { machineName } },
      schema: DEVICE_CODE_SCHEMA,
    });
  }

  /** Trades a sign-in code for this machine's token once the person confirmed it; `authorization_pending` until then. */
  public async deviceToken(deviceCode: string): Promise<ProAnswer<IProDeviceToken>> {
    return this.call({
      request: { method: 'POST', path: '/device/tokens', body: { deviceCode } },
      schema: DEVICE_TOKEN_SCHEMA,
    });
  }

  /** The account a token belongs to, and its orgs. */
  public async me(token: string): Promise<ProAnswer<IProMe>> {
    return this.call({
      request: { method: 'GET', path: '/me', token },
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
        path: `/me/machines/${encodeURIComponent(props.machineId)}`,
        token: props.token,
      },
      schema: z.null(),
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
