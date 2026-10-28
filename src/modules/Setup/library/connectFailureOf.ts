import type { ConnectFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';
import { GITHUB_FAILURE_KEYS } from '@/modules/Setup/constants';

/**
 * O que dizer ao QA quando um tracker não conectou, como uma chave e as palavras que a
 * preenchem, no idioma que ele lê.
 */
export function connectFailureOf(props: { failure: ConnectFailure; tracker: string }): {
  key: ParseKeys;
  values: { tracker?: string; status?: string; scopes?: string };
} {
  const { failure, tracker } = props;

  switch (failure.reason) {
    case 'unauthorized':
      return { key: 'SETUP.CONNECT_UNAUTHORIZED', values: { tracker } };
    case 'unreachable':
      return { key: 'SETUP.CONNECT_UNREACHABLE', values: { tracker } };
    case 'unexpected':
      return {
        key: 'SETUP.CONNECT_UNEXPECTED',
        values: { tracker, status: String(failure.status) },
      };
    case 'bad-site':
      return { key: 'SETUP.CONNECT_BAD_SITE', values: {} };
    case 'no-keychain':
      return { key: 'SETUP.CONNECT_NO_KEYCHAIN', values: {} };
    case 'no-bridge':
      return { key: 'COMMON.NO_BRIDGE', values: {} };
    case 'github':
      return { key: GITHUB_FAILURE_KEYS[failure.failure], values: {} };
    case 'scopes':
      return {
        key: 'SETUP.CONNECT_SCOPES',
        values: { scopes: failure.scopes.join(', ') },
      };
  }
}
