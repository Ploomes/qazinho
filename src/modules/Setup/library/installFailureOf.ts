import type { InstallFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

const MISSING: Record<string, ParseKeys> = {
  npm: 'SETUP.INSTALL_MISSING_NPM',
  brew: 'SETUP.INSTALL_MISSING_BREW',
  winget: 'SETUP.INSTALL_MISSING_WINGET',
  python3: 'SETUP.INSTALL_MISSING_PYTHON',
};

/**
 * What to tell the QA when an install did not finish: a key and the words that fill it in
 * their language, or what the tool itself printed, as it printed it.
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
