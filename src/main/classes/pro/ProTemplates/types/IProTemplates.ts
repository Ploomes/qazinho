import type { ProApi } from '@/main/classes/pro/ProApi';

/**
 * O que os modelos das orgs precisam: a plataforma, o token desta máquina, e o arquivo
 * onde fica o que cada org tinha da última vez.
 */
export interface IProTemplates {
  api: Pick<
    ProApi,
    'templates' | 'saveTemplate' | 'removeTemplate' | 'setDefaultTemplate'
  >;
  token: () => Promise<string | null>;
  file: string;
}
