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

/**
 * Fala com a API do QAzinho Pro por esta máquina: o login por um código que a pessoa
 * confirma no navegador, a conta dela e a sincronização dos projetos compartilhados.
 */
export class ProApi {
  private readonly baseUrl: string;
  private readonly fetcher: ProFetcher;

  public constructor(props: IProApi) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, '');
    this.fetcher = props.fetcher;
  }

  /** Pede à plataforma um código de login para esta máquina. */
  public async deviceCode(machineName: string): Promise<ProAnswer<IProDeviceCode>> {
    return this.call({
      request: { method: 'POST', path: '/api/device/codes', body: { machineName } },
      schema: DEVICE_CODE_SCHEMA,
    });
  }

  /**
   * Troca um código de login pelo token desta máquina depois que a pessoa o confirmou;
   * `authorization_pending` até lá.
   */
  public async deviceToken(deviceCode: string): Promise<ProAnswer<IProDeviceToken>> {
    return this.call({
      request: { method: 'POST', path: '/api/device/tokens', body: { deviceCode } },
      schema: DEVICE_TOKEN_SCHEMA,
    });
  }

  /** A conta a que um token pertence, e as orgs dela. */
  public async me(token: string): Promise<ProAnswer<IProMe>> {
    return this.call({
      request: { method: 'GET', path: '/api/me', token },
      schema: ME_SCHEMA,
    });
  }

  /** Faz uma máquina sair: o token dela para de funcionar. */
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

  /**
   * Manda um projeto compartilhado: o nome, os alvos, os repositórios e os nomes das
   * variáveis.
   */
  public async syncProject(
    call: IProSyncCall,
  ): Promise<ProAnswer<z.infer<typeof SYNC_PROJECT_SCHEMA>>> {
    return this.put({ call, schema: SYNC_PROJECT_SCHEMA });
  }

  /**
   * Manda o plano de um workspace a partir da versão em que foi baseado; `plan_conflict`
   * quando a org o mexeu desde então.
   */
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

  /** Substitui as gravações de um plano numa branch. */
  public async syncRecordings(call: IProSyncCall): Promise<ProAnswer<null>> {
    return this.put({ call, schema: z.null() });
  }

  /**
   * Os projetos que uma org guarda, cada um com os planos dele, para esta máquina baixar.
   */
  public async syncedProjects(props: {
    token: string;
    org: string;
  }): Promise<ProAnswer<z.infer<typeof SYNCED_PROJECTS_SCHEMA>>> {
    return this.call({
      request: {
        method: 'GET',
        path: `/api/orgs/${encodeURIComponent(props.org)}/projects?include=plans`,
        token: props.token,
      },
      schema: SYNCED_PROJECTS_SCHEMA,
    });
  }

  /** Apaga um projeto na org dele, pelo id com que este computador o guarda. */
  public async deleteProject(props: {
    token: string;
    org: string;
    projectId: string;
  }): Promise<ProAnswer<null>> {
    return this.call({
      request: {
        method: 'DELETE',
        path: `/api/orgs/${encodeURIComponent(props.org)}/projects/${encodeURIComponent(props.projectId)}`,
        token: props.token,
      },
      schema: z.null(),
    });
  }

  /**
   * As gravações de um plano numa branch, para andar os casos dele de novo sem o agente.
   */
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

  /**
   * Pergunta onde pôr um screenshot ou vídeo, assinado para esta máquina por pouco tempo.
   */
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
