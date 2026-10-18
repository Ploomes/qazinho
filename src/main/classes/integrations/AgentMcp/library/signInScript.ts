const quote = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;

/** The script Terminal runs to sign the QA in: the agent, opened straight on its MCP servers. */
export function signInScript(props: {
  command: string;
  args: string[];
  folder: string;
  server: string;
}): string {
  return [
    '#!/bin/zsh -l',
    `cd ${quote(props.folder)}`,
    'clear',
    `echo ${quote(`QAzinho: pick "${props.server}" below, choose Authenticate and finish in the browser. Then close this window.`)}`,
    `exec ${[props.command, ...props.args].map(quote).join(' ')}`,
    '',
  ].join('\n');
}
