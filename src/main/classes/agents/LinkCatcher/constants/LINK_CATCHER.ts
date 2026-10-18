export const LINK_CATCHER = [
  '#!/bin/sh',
  `printf '%s\\n' "$1" >> "$QAZINHO_LINKS"`,
  '',
].join('\n');
