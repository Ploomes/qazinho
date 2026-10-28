import type { JiraAnswer, JiraFetcher } from '@/main/classes/integrations/JiraApi/types';
import type { IJiraCredentials } from '@/main/types';
import { JIRA_READ } from '@/main/classes/integrations/JiraApi/constants';
import { jiraFailureOf } from './jiraFailureOf';
import { jiraSaidOf } from './jiraSaidOf';

/**
 * Um pedido ao site Atlassian do QA, Jira ou Confluence, assinado com o e-mail e o token
 * dele: o JSON ou os bytes, ou por que falhou, nas palavras do próprio site.
 */
export function askAtlassian(props: {
  fetcher: JiraFetcher;
  signed: IJiraCredentials;
  path: string;
  method?: 'POST' | 'PUT';
  json?: unknown;
  form?: FormData;
  isBinary?: boolean;
  isEmpty?: boolean;
  timeoutMs?: number;
}): Promise<JiraAnswer> {
  const { signed, json, form } = props;
  const basic = Buffer.from(`${signed.email}:${signed.token}`).toString('base64');

  return props
    .fetcher(`${signed.site}${props.path}`, {
      method: props.method ?? 'GET',
      headers: {
        Accept: props.isBinary === true ? '*/*' : 'application/json',
        Authorization: `Basic ${basic}`,
        ...(json === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(form === undefined ? {} : { 'X-Atlassian-Token': 'no-check' }),
      },
      ...(json === undefined ? {} : { body: JSON.stringify(json) }),
      ...(form === undefined ? {} : { body: form }),
      signal: AbortSignal.timeout(
        props.timeoutMs ??
          (props.isBinary === true ? JIRA_READ.downloadTimeoutMs : JIRA_READ.timeoutMs),
      ),
    })
    .then(
      async (answer): Promise<JiraAnswer> => {
        if (!answer.ok)
          return {
            isOk: false,
            failure: jiraFailureOf(answer),
            said: jiraSaidOf(await answer.json().catch(() => null)),
          };

        if (props.isEmpty === true) return { isOk: true, body: null, bytes: null };

        if (props.isBinary === true)
          return answer.arrayBuffer().then(
            (bytes): JiraAnswer => ({ isOk: true, body: null, bytes }),
            (): JiraAnswer => ({ isOk: false, failure: 'unreachable', said: '' }),
          );

        return answer.json().then(
          (body): JiraAnswer => ({ isOk: true, body, bytes: null }),
          (): JiraAnswer => ({ isOk: false, failure: 'unexpected', said: '' }),
        );
      },
      (): JiraAnswer => ({ isOk: false, failure: 'unreachable', said: '' }),
    );
}
