import type { IKeyPress } from '@/main/types';

/**
 * Se a tecla é o Ctrl+Q com que um app do Linux sai: lá a bandeja pode não aparecer, e
 * fechar a janela não sai mais.
 */
export function isQuitKey(props: {
  platform: NodeJS.Platform;
  press: IKeyPress;
}): boolean {
  const { platform, press } = props;

  return (
    platform === 'linux' &&
    press.type === 'keyDown' &&
    press.key.toLowerCase() === 'q' &&
    press.control &&
    !press.meta &&
    !press.alt &&
    !press.shift
  );
}
