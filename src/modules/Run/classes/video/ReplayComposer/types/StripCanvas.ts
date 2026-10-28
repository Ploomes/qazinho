/**
 * A parte de um canvas 2D com que a faixa desenha, para um teste poder entregar um fake.
 */
export type StripCanvas = Pick<
  OffscreenCanvasRenderingContext2D,
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'lineCap'
  | 'lineJoin'
  | 'font'
  | 'letterSpacing'
  | 'textAlign'
  | 'textBaseline'
  | 'globalAlpha'
  | 'save'
  | 'restore'
  | 'beginPath'
  | 'rect'
  | 'clip'
  | 'roundRect'
  | 'arc'
  | 'moveTo'
  | 'lineTo'
  | 'fill'
  | 'stroke'
  | 'fillRect'
  | 'fillText'
  | 'measureText'
>;
