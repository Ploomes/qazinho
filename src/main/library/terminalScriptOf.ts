/**
 * O script que um terminal visível roda: o que o QAzinho diz ao QA, depois o comando, na
 * pasta dada; um login shell no Mac ou Linux, um arquivo batch no Windows.
 */
export function terminalScriptOf(props: {
  command: string;
  args: string[];
  folder: string;
  say: string;
  platform: NodeJS.Platform;
}): string {
  const { say } = props;

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

const quote = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;

const quoteForCmd = (text: string) => `"${text.replace(/%/g, '%%').replace(/"/g, '""')}"`;
