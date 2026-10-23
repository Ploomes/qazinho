const quote = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;
const quoteForCmd = (text: string) => `"${text.replace(/%/g, '%%').replace(/"/g, '""')}"`;

/** The script a terminal runs to sign the QA in: the agent, opened straight on its MCP servers; a login shell on a Mac or Linux, a batch file on Windows. */
export function signInScript(props: {
  command: string;
  args: string[];
  folder: string;
  server: string;
  platform: NodeJS.Platform;
}): string {
  const say = `QAzinho: pick "${props.server}" below, choose Authenticate and finish in the browser. Then close this window.`;

  if (props.platform === 'win32')
    return [
      '@echo off',
      `cd /d ${quoteForCmd(props.folder)}`,
      'cls',
      `echo ${say.replace(/([&|<>^%])/g, '^$1')}`,
      `call ${[props.command, ...props.args].map(quoteForCmd).join(' ')}`,
      '',
    ].join('\r\n');

  return [
    props.platform === 'darwin' ? '#!/bin/zsh -l' : '#!/bin/sh',
    `cd ${quote(props.folder)}`,
    'clear',
    `echo ${quote(say)}`,
    `exec ${[props.command, ...props.args].map(quote).join(' ')}`,
    '',
  ].join('\n');
}
