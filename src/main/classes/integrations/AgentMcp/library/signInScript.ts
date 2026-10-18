const quote = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;

/** The script Terminal runs to sign the QA in: Claude Code, opened straight on its MCP servers. */
export function signInScript(props: {
  claude: string;
  folder: string;
  server: string;
}): string {
  return [
    '#!/bin/zsh -l',
    `cd ${quote(props.folder)}`,
    'clear',
    `echo ${quote(`QAzinho: pick "${props.server}" below, choose Authenticate and finish in the browser. Then close this window.`)}`,
    `exec ${quote(props.claude)} '/mcp'`,
    '',
  ].join('\n');
}
