import type { IProTemplates } from './types';
import type {
  IOrgTemplateDefault,
  IOrgTemplateRef,
  IOrgTemplates,
  ISaveOrgTemplate,
  OrgTemplateDone,
  OrgTemplateSaved,
  OrgTemplatesRead,
} from '@/shared/types';
import { readFile } from 'node:fs/promises';
import { writeAtomically } from '@/main/library';
import { orgTemplateOf, remoteTemplateIdOf, templateFailureOf } from './library';

/**
 * Os modelos que as orgs da conta guardam: lê, publica, reescreve, tira e escolhe o
 * padrão de cada tipo, com o que cada org tinha guardado aqui para quando não há rede.
 */
export class ProTemplates {
  private readonly api: IProTemplates['api'];
  private readonly token: () => Promise<string | null>;
  private readonly file: string;

  public constructor(props: IProTemplates) {
    this.api = props.api;
    this.token = props.token;
    this.file = props.file;
  }

  /** Os modelos de uma org; sem resposta, os que ela tinha da última vez. */
  public async list(orgSlug: string): Promise<OrgTemplatesRead> {
    const token = await this.token();

    if (token === null) return { isListed: false, failure: 'signed-out' };

    const answer = await this.api.templates({ token, org: orgSlug });

    if (answer.isOk) {
      const list: IOrgTemplates = {
        orgSlug,
        templates: answer.value.templates.map((template) =>
          orgTemplateOf({ orgSlug, template }),
        ),
        canPublish: answer.value.canPublish,
        canSetDefault: answer.value.canSetDefault,
      };

      await this.keep(list);

      return { isListed: true, list };
    }

    const failure = templateFailureOf(answer.status);
    const kept = failure === 'unreachable' ? (await this.read())[orgSlug] : undefined;

    return kept === undefined
      ? { isListed: false, failure }
      : { isListed: true, list: kept };
  }

  /** Publica um modelo na org, ou reescreve o que ela já tem com aquele id. */
  public async save(props: ISaveOrgTemplate): Promise<OrgTemplateSaved> {
    const { orgSlug, template } = props;
    const token = await this.token();
    const id = template.id === null ? null : remoteTemplateIdOf(template.id);

    if (token === null) return { isSaved: false, failure: 'signed-out' };
    if (template.id !== null && id === null) return { isSaved: false, failure: 'failed' };

    const answer = await this.api.saveTemplate({
      token,
      org: orgSlug,
      id,
      body: {
        kind: template.kind,
        name: template.name.trim(),
        title: template.title,
        parts: template.parts,
        cases: template.cases,
      },
    });

    return answer.isOk
      ? { isSaved: true, template: orgTemplateOf({ orgSlug, template: answer.value }) }
      : { isSaved: false, failure: templateFailureOf(answer.status) };
  }

  /** Tira um modelo da org. */
  public async remove(props: IOrgTemplateRef): Promise<OrgTemplateDone> {
    const token = await this.token();
    const id = remoteTemplateIdOf(props.id);

    if (token === null) return { isDone: false, failure: 'signed-out' };
    if (id === null) return { isDone: false, failure: 'failed' };

    const answer = await this.api.removeTemplate({ token, org: props.orgSlug, id });

    return answer.isOk
      ? { isDone: true }
      : { isDone: false, failure: templateFailureOf(answer.status) };
  }

  /** Faz de um modelo o padrão do tipo dele na org, ou deixa o tipo sem padrão. */
  public async setDefault(props: IOrgTemplateDefault): Promise<OrgTemplateDone> {
    const token = await this.token();
    const id = props.id === null ? null : remoteTemplateIdOf(props.id);

    if (token === null) return { isDone: false, failure: 'signed-out' };
    if (props.id !== null && id === null) return { isDone: false, failure: 'failed' };

    const answer = await this.api.setDefaultTemplate({
      token,
      org: props.orgSlug,
      kind: props.kind,
      id,
    });

    return answer.isOk
      ? { isDone: true }
      : { isDone: false, failure: templateFailureOf(answer.status) };
  }

  private async read(): Promise<Record<string, IOrgTemplates>> {
    const text = await readFile(this.file, 'utf8').catch(() => null);

    if (text === null) return {};

    try {
      return JSON.parse(text) as Record<string, IOrgTemplates>;
    } catch {
      return {};
    }
  }

  private async keep(list: IOrgTemplates): Promise<void> {
    const kept = await this.read();

    await writeAtomically({
      file: this.file,
      data: JSON.stringify({ ...kept, [list.orgSlug]: list }, null, 2),
    }).catch(() => undefined);
  }
}
