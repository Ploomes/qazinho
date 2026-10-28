import type { IDesignLink } from '@/shared/types';

/**
 * Onde um frame do design abre no Figma: o próprio link do design, com o node-id trocado
 * pelo do frame.
 */
export function frameUrlOf(props: { design: IDesignLink; frame: string }): string {
  const url = new URL(props.design.url);

  url.searchParams.set('node-id', props.frame.replace(':', '-'));

  return url.toString();
}
