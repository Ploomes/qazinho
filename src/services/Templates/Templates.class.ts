import type {
  IOrgTemplateDefault,
  IOrgTemplateRef,
  ISaveOrgTemplate,
  ISaveTemplate,
  ITemplate,
  OrgTemplateDone,
  OrgTemplateSaved,
  OrgTemplatesRead,
  TemplateSaved,
} from '@/shared/types';

/** O único que chama o lado dos modelos da bridge, os do QA e os das orgs. */
export class Templates {
  public static async list(): Promise<ITemplate[]> {
    return (await window.qazinho?.listTemplates()) ?? [];
  }

  public static async save(template: ISaveTemplate): Promise<TemplateSaved> {
    return (
      (await window.qazinho?.saveTemplate(template)) ?? {
        isSaved: false,
        reason: 'unwritable',
      }
    );
  }

  public static async remove(id: string): Promise<boolean> {
    return (await window.qazinho?.removeTemplate(id)) ?? false;
  }

  public static async listOrg(orgSlug: string): Promise<OrgTemplatesRead> {
    return (
      (await window.qazinho?.listOrgTemplates(orgSlug)) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }

  public static async saveOrg(save: ISaveOrgTemplate): Promise<OrgTemplateSaved> {
    return (
      (await window.qazinho?.saveOrgTemplate(save)) ?? {
        isSaved: false,
        failure: 'unreachable',
      }
    );
  }

  public static async removeOrg(template: IOrgTemplateRef): Promise<OrgTemplateDone> {
    return (
      (await window.qazinho?.removeOrgTemplate(template)) ?? {
        isDone: false,
        failure: 'unreachable',
      }
    );
  }

  public static async setOrgDefault(
    choice: IOrgTemplateDefault,
  ): Promise<OrgTemplateDone> {
    return (
      (await window.qazinho?.setOrgTemplateDefault(choice)) ?? {
        isDone: false,
        failure: 'unreachable',
      }
    );
  }
}
