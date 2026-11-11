import type { CloseMove } from '@/main/types';

/**
 * Fechar a janela a esconde e deixa o app vivo, como o Discord; só um app saindo fecha.
 * Uma janela em tela cheia sai dela antes, ou o Mac deixa um espaço preto no lugar.
 */
export function closeMoveOf(props: {
  isQuitting: boolean;
  isFullScreen: boolean;
}): CloseMove {
  if (props.isQuitting) return 'close';

  return props.isFullScreen ? 'leave-full-screen' : 'hide';
}
