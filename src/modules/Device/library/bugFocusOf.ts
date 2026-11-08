import type { IBugFocus } from '@/modules/Device/types';
import type { IScreenBox } from '@/shared/types';
import { BUG_FOCUS } from '@/modules/Device/constants';

/**
 * Até onde a foto chega perto de uma coisa: o bastante para ela ser lida, sem nunca
 * mostrar além da borda da foto.
 */
export function bugFocusOf(box: IScreenBox): IBugFocus {
  const zoom = between({
    value: Math.min(
      BUG_FOCUS.widthShare / (box.width + 2 * BUG_FOCUS.roomX),
      BUG_FOCUS.heightShare / (box.height + 2 * BUG_FOCUS.roomY),
    ),
    least: 1,
    most: BUG_FOCUS.maxZoom,
  });
  const shiftX = shiftOf({ middle: box.x + box.width / 2, zoom });
  const shiftY = shiftOf({ middle: box.y + box.height / 2, zoom });

  return {
    zoom,
    shiftX,
    shiftY,
    left: box.x * zoom + shiftX,
    top: box.y * zoom + shiftY,
    width: box.width * zoom,
    height: box.height * zoom,
  };
}

function shiftOf(props: { middle: number; zoom: number }): number {
  const { middle, zoom } = props;

  return between({ value: 0.5 - middle * zoom, least: 1 - zoom, most: 0 });
}

function between(props: { value: number; least: number; most: number }): number {
  return Math.min(Math.max(props.value, props.least), props.most);
}
