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
  DESKTOP_VERSION_HEADER,
  DEVICE_CODE_SCHEMA,
  DEVICE_TOKEN_SCHEMA,
  EVIDENCE_UPLOAD_SCHEMA,
  ME_SCHEMA,
  ORG_TEMPLATE_SCHEMA,
  ORG_TEMPLATES_SCHEMA,
  RECORDINGS_SCHEMA,
  SYNC_BUG_SCHEMA,
  SYNC_MEMORIES_SCHEMA,
  SYNC_PLAN_SCHEMA,
  SYNC_PROJECT_SCHEMA,
  SYNC_RUN_SCHEMA,
  SYNCED_PROJECTS_SCHEMA,
  TEST_FILE_UPLOAD_SCHEMA,
  UPDATE_REQUIRED_STATUS,
} from './constants';
import { answerOf } from './library';

/**
 * Fala com a API do QAzinho Pro por esta máquina: o login por um código que a pessoa
 * confirma no navegador, a conta dela e a sincronização dos projetos compartilhados.
 */
export class ProApi {
  private readonly baseUrl: string;
  private readonly fetcher: ProFetcher;
  private readonly version: string;
  private readonly onUpdateRequired: () => void;

  public constructor(props: IProApi) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, '');
    this.fetcher = props.fetcher;
    this.version = props.version;
    this.onUpdateRequired = props.onUpdateRequired;
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

  /** Manda o que o agente aprendeu num projeto, e recebe a lista como a org a tem. */
  public async syncMemories(
    call: IProSyncCall,
  ): Promise<ProAnswer<z.infer<typeof SYNC_MEMORIES_SCHEMA>>> {
    return this.put({ call, schema: SYNC_MEMORIES_SCHEMA });
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

  /** Guarda na org um arquivo que os testes sobem, ou ouve que ela já o tem. */
  public async keepTestFile(
    call: IProSyncCall,
  ): Promise<ProAnswer<z.infer<typeof TEST_FILE_UPLOAD_SCHEMA>>> {
    return this.call({
      request: {
        method: 'POST',
        path: `/api/orgs/${encodeURIComponent(call.org)}/${call.path}`,
        body: call.body,
        token: call.token,
      },
      schema: TEST_FILE_UPLOAD_SCHEMA,
    });
  }

  /** Onde baixar um arquivo de teste da org, com o que o pedido precisa levar. */
  public testFileAddress(props: { token: string; org: string; sha256: string }): {
    url: string;
    headers: Record<string, string>;
  } {
    return {
      url: `${this.baseUrl}/api/orgs/${encodeURIComponent(props.org)}/test-files/${props.sha256}`,
      headers: {
        [DESKTOP_VERSION_HEADER]: this.version,
        authorization: `Bearer ${props.token}`,
      },
    };
  }

  /** Os modelos de uma org, e o que o papel da conta deixa fazer com eles. */
  public async templates(props: {
    token: string;
    org: string;
  }): Promise<ProAnswer<z.infer<typeof ORG_TEMPLATES_SCHEMA>>> {
    return this.call({
      request: {
        method: 'GET',
        path: `/api/orgs/${encodeURIComponent(props.org)}/templates`,
        token: props.token,
      },
      schema: ORG_TEMPLATES_SCHEMA,
    });
  }

  /** Publica um modelo na org, ou reescreve o que tem este id lá. */
  public async saveTemplate(props: {
    token: string;
    org: string;
    id: string | null;
    body: unknown;
  }): Promise<ProAnswer<z.infer<typeof ORG_TEMPLATE_SCHEMA>>> {
    const { token, org, id, body } = props;
    const templates = `/api/orgs/${encodeURIComponent(org)}/templates`;

    return this.call({
      request:
        id === null
          ? { method: 'POST', path: templates, body, token }
          : {
              method: 'PUT',
              path: `${templates}/${encodeURIComponent(id)}`,
              body,
              token,
            },
      schema: ORG_TEMPLATE_SCHEMA,
    });
  }

  public async removeTemplate(props: {
    token: string;
    org: string;
    id: string;
  }): Promise<ProAnswer<null>> {
    return this.call({
      request: {
        method: 'DELETE',
        path: `/api/orgs/${encodeURIComponent(props.org)}/templates/${encodeURIComponent(props.id)}`,
        token: props.token,
      },
      schema: z.null(),
    });
  }

  /** Faz de um modelo o padrão do tipo dele na org, ou deixa o tipo sem padrão. */
  public async setDefaultTemplate(props: {
    token: string;
    org: string;
    kind: string;
    id: string | null;
  }): Promise<ProAnswer<null>> {
    return this.call({
      request: {
        method: 'PUT',
        path: `/api/orgs/${encodeURIComponent(props.org)}/templates/defaults/${encodeURIComponent(props.kind)}`,
        body: { templateId: props.id },
        token: props.token,
      },
      schema: z.null(),
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
    const headers: Record<string, string> = { [DESKTOP_VERSION_HEADER]: this.version };

    if (request.body !== undefined) headers['content-type'] = 'application/json';
    if (request.token !== undefined) headers.authorization = `Bearer ${request.token}`;

    try {
      const response = await this.fetcher(`${this.baseUrl}${request.path}`, {
        method: request.method,
        headers,
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      });

      const answer = await answerOf({ response, schema });

      if (!answer.isOk && answer.status === UPDATE_REQUIRED_STATUS)
        this.onUpdateRequired();

      return answer;
    } catch {
      return { isOk: false, status: 0, error: 'unreachable' };
    }
  }
}
