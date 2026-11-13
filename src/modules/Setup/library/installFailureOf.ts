import type { InstallFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

const MISSING: Record<string, ParseKeys> = {
  npm: 'SETUP.INSTALL_MISSING_NPM',
  brew: 'SETUP.INSTALL_MISSING_BREW',
  winget: 'SETUP.INSTALL_MISSING_WINGET',
};

/**
 * O que dizer ao QA quando uma instalação não terminou: uma chave e as palavras que a
 * preenchem no idioma dele, ou o que a própria ferramenta imprimiu, como imprimiu.
 */
export function installFailureOf(
  failure: InstallFailure,
): { key: ParseKeys; values: { tool?: string; code?: string } } | { text: string } {
  switch (failure.reason) {
    case 'busy':
      return { key: 'SETUP.INSTALL_BUSY', values: {} };
    case 'missing':
      return {
        key: MISSING[failure.tool] ?? 'SETUP.INSTALL_MISSING_OTHER',
        values: { tool: failure.tool },
      };
    case 'stopped':
      return {
        key: 'SETUP.INSTALL_STOPPED',
        values: { tool: failure.tool, code: String(failure.code) },
      };
    case 'no-bridge':
      return { key: 'COMMON.NO_BRIDGE', values: {} };
    case 'said':
      return { text: failure.text };
  }
}
