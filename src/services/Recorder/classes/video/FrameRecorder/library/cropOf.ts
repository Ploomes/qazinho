import type { IRect, ISize } from '@/services/Recorder/classes/video/FrameRecorder/types';

/**
 * A parte de um frame que a tela mostra: o Chrome mantém a janela com 500px de largura,
 * então uma página do tamanho de um celular é a esquerda de um frame mais largo.
 */
export function cropOf(props: ISize & { ratio: number }): IRect {
  const width =
    props.ratio > 0
      ? Math.min(props.width, Math.round(props.height * props.ratio))
      : props.width;

  return { x: 0, y: 0, width: Math.max(1, width), height: props.height };
}
