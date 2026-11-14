/** Onde um ponto da página cai na tela do dispositivo mostrada, em frações dela. */
export function touchFractionOf(props: {
  clientX: number;
  clientY: number;
  rect: { left: number; top: number; width: number; height: number };
}): { x: number; y: number } {
  const { clientX, clientY, rect } = props;

  return {
    x: inside((clientX - rect.left) / Math.max(rect.width, 1)),
    y: inside((clientY - rect.top) / Math.max(rect.height, 1)),
  };
}

function inside(fraction: number): number {
  return Math.min(Math.max(fraction, 0), 1);
}
