import { AGENT_TERMINAL } from './AGENT_TERMINAL';

export const RELAY_SCRIPT = [
  'set timeout -1',
  'log_user 1',
  `set stty_init "rows ${String(AGENT_TERMINAL.height)} columns ${String(AGENT_TERMINAL.width)}"`,
  'spawn -noecho {*}$argv',
  'fconfigure stdin -blocking 0 -translation binary -buffering none',
  'fileevent stdin readable {',
  '  set data [read stdin]',
  '  if {[eof stdin]} { exit 0 }',
  '  send -- $data',
  '}',
  'expect eof',
  '',
].join('\n');
