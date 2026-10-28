import { GITHUB_CLI } from '@/main/classes/integrations/GithubCli/constants';

const CODE = /one-time code:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i;
const PAGE = /(https:\/\/\S+\/login\/device)\b/;

/**
 * O código de uso único que o gh pede ao QA que digite no GitHub, e a página onde
 * digitá-lo, assim que o gh os imprimiu.
 */
export function deviceCodeIn(text: string): { code: string; url: string } | null {
  const code = CODE.exec(text)?.[1];

  if (code === undefined) return null;

  return { code: code.toUpperCase(), url: PAGE.exec(text)?.[1] ?? GITHUB_CLI.deviceUrl };
}
