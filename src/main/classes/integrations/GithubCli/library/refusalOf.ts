import type { IGhRefusal } from '@/main/classes/integrations/GithubCli/types';

const SIGNED_OUT = /gh auth login|not logged in|authentication required/i;
const UNREACHABLE =
  /error connecting|dial tcp|no such host|i\/o timeout|network is unreachable|connection refused|tls handshake/i;
const HTTP = /\(HTTP (\d{3})\)/;

/**
 * Por que um comando do gh falhou, pelo código de saída e pelo que disse: deslogado,
 * recusado, ausente, offline, ou outra coisa.
 */
export function refusalOf(props: { code: number | null; said: string }): IGhRefusal {
  const { code, said } = props;
  const httpStatus = Number(HTTP.exec(said)?.[1] ?? 0) || null;

  if (code === 4 || SIGNED_OUT.test(said))
    return { failure: 'signed-out', httpStatus, said };
  if (httpStatus === 404) return { failure: 'not-found', httpStatus, said };
  if (httpStatus === 401 || httpStatus === 403)
    return { failure: 'denied', httpStatus, said };
  if (UNREACHABLE.test(said)) return { failure: 'unreachable', httpStatus, said };

  return { failure: 'unexpected', httpStatus, said };
}
