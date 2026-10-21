import type {
  IRect,
  IStripLook,
  IStripWords,
  StripCanvas,
} from '@/modules/Run/classes/video/ReplayComposer/types';
import type { IReplayRequest, IRequestAt } from '@/modules/Run/types';
import { NETWORK_STRIP } from '@/modules/Run/classes/video/ReplayComposer/constants';
import { NETWORK, REQUEST_OUTCOMES } from '@/modules/Run/constants';
import {
  formatClock,
  formatRequestSize,
  formatRequestTime,
  networkAt,
  requestBarOf,
} from '@/modules/Run/library';

const TONE_COLOURS = { pass: 'pass', quiet: 'ink3', attn: 'attn', fail: 'fail' } as const;

function fitText(props: { context: StripCanvas; text: string; width: number }): string {
  const { context, text, width } = props;

  if (context.measureText(text).width <= width) return text;

  let low = 0;
  let high = text.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);

    if (context.measureText(`${text.slice(0, middle)}…`).width <= width) low = middle;
    else high = middle - 1;
  }

  return low === 0 ? '' : `${text.slice(0, low)}…`;
}

function drawArrows(props: {
  context: StripCanvas;
  x: number;
  y: number;
  size: number;
  colour: string;
}): void {
  const { context, x, y, size, colour } = props;
  const half = size / 2;
  const head = size * 0.3;
  const apart = size * 0.5;

  context.strokeStyle = colour;
  context.lineWidth = size * 0.16;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(x, y + half);
  context.lineTo(x, y - half);
  context.moveTo(x - head, y - half + head);
  context.lineTo(x, y - half);
  context.lineTo(x + head, y - half + head);
  context.moveTo(x + apart, y - half);
  context.lineTo(x + apart, y + half);
  context.moveTo(x + apart - head, y + half - head);
  context.lineTo(x + apart, y + half);
  context.lineTo(x + apart + head, y + half - head);
  context.stroke();
}

function codeOf(props: { request: IReplayRequest; words: IStripWords }): string {
  const { request, words } = props;

  if (request.outcome === 'failed') return words.failed;

  if (request.outcome === 'canceled') return words.canceled;

  return request.status !== null && request.status >= 100 ? String(request.status) : '—';
}

/** Draws the strip as the video stood at one moment: its head with the count, the errors and the clock, and the latest requests, each ended or still waiting. */
export function drawNetworkStrip(props: {
  context: StripCanvas;
  box: IRect;
  scale: number;
  requests: IReplayRequest[];
  atMs: number;
  isShowingFiles: boolean;
  look: IStripLook;
  words: IStripWords;
}): void {
  const { context, box, scale, look, words, atMs } = props;
  const px = (value: number) => value * scale;
  const fontOf = (weight: number) => (size: number) =>
    `${String(weight)} ${String(px(size))}px ${NETWORK_STRIP.mono}`;
  const at = networkAt({
    requests: props.requests,
    atMs,
    isShowingFiles: props.isShowingFiles,
  });
  const typeLabels: Readonly<Record<string, string>> = NETWORK.types;
  const left = box.x + px(NETWORK_STRIP.padPx);
  const right = box.x + box.width - px(NETWORK_STRIP.padPx);
  const gap = px(NETWORK_STRIP.gapPx);
  const rowHeight = px(NETWORK_STRIP.rowPx);
  const headY = box.y + px(NETWORK_STRIP.headPx) / 2;
  const rowsTop = box.y + px(NETWORK_STRIP.headPx);
  const fits = Math.max(
    0,
    Math.floor(
      (box.height - px(NETWORK_STRIP.headPx) - px(NETWORK_STRIP.bottomPx)) / rowHeight,
    ),
  );
  const rows: IRequestAt[] = fits === 0 ? [] : at.rows.slice(-fits);

  context.save();
  context.beginPath();
  context.rect(box.x, box.y, box.width, box.height);
  context.clip();
  context.fillStyle = look.panel;
  context.fillRect(box.x, box.y, box.width, box.height);
  context.fillStyle = look.line;
  context.fillRect(box.x, box.y, box.width, Math.max(1, Math.round(scale)));
  context.textBaseline = 'middle';
  context.textAlign = 'left';

  drawArrows({ context, x: left + px(2), y: headY, size: px(9), colour: look.limeInk });

  const title = words.title.toUpperCase();
  const count = words.count({ shown: at.shown, total: at.total });
  let cursor = left + px(16);

  context.font = fontOf(700)(NETWORK_STRIP.smallFontPx);
  context.letterSpacing = `${String(px(NETWORK_STRIP.tagTrackingPx))}px`;
  context.fillStyle = look.ink2;
  context.fillText(title, cursor, headY);
  cursor += context.measureText(title).width + gap;
  context.letterSpacing = '0px';
  context.font = fontOf(400)(NETWORK_STRIP.smallFontPx);
  context.fillStyle = look.ink3;
  context.fillText(count, cursor, headY);
  cursor += context.measureText(count).width + gap * 1.5;

  if (at.errors > 0) {
    const errors = words.errors(at.errors);
    const chipWidth = context.measureText(errors).width + px(16);

    context.fillStyle = look.failSoft;
    context.beginPath();
    context.roundRect(cursor, headY - px(8), chipWidth, px(16), px(8));
    context.fill();
    context.fillStyle = look.fail;
    context.fillText(errors, cursor + px(8), headY);
  }

  context.textAlign = 'right';
  context.fillStyle = look.ink3;
  context.fillText(formatClock(atMs), right, headY);
  context.textAlign = 'left';

  context.font = fontOf(400)(NETWORK_STRIP.fontPx);

  const ch = context.measureText('0').width;
  const columns = NETWORK_STRIP.columns;
  const fixed =
    (columns.clock +
      columns.method +
      columns.status +
      columns.type +
      columns.bar +
      columns.time +
      columns.size) *
      ch +
    gap * 7;
  const urlWidth = Math.max(0, right - left - fixed);
  const methodX = left + columns.clock * ch + gap;
  const statusX = methodX + columns.method * ch + gap;
  const urlX = statusX + columns.status * ch + gap;
  const typeX = urlX + urlWidth + gap;
  const barX = typeX + columns.type * ch + gap;
  const barWidth = columns.bar * ch;
  const timeRight = barX + barWidth + gap + columns.time * ch;

  if (rows.length === 0) {
    context.textAlign = 'center';
    context.fillStyle = look.ink3;
    context.fillText(
      words.empty,
      box.x + box.width / 2,
      rowsTop + (box.height - px(NETWORK_STRIP.headPx)) / 2,
    );
    context.textAlign = 'left';
  }

  rows.forEach(({ request, isDone, elapsedMs }, index) => {
    const fresh = Math.min(
      1,
      Math.max(0, (atMs - request.fromMs) / NETWORK_STRIP.freshMs),
    );
    const middle =
      rowsTop + index * rowHeight + rowHeight / 2 + (1 - fresh) * px(NETWORK_STRIP.riseY);
    const outcome = REQUEST_OUTCOMES[request.outcome];
    const tone = isDone ? look[TONE_COLOURS[outcome.tone]] : look.ink3;
    const dot = px(NETWORK_STRIP.dotPx);
    const bar = px(NETWORK_STRIP.barPx);

    context.globalAlpha = fresh;

    if (index === rows.length - 1) {
      context.fillStyle = look.limeSoft;
      context.beginPath();
      context.roundRect(
        box.x + px(8),
        middle - rowHeight / 2,
        box.width - px(16),
        rowHeight,
        px(6),
      );
      context.fill();
      context.fillStyle = look.lime;
      context.fillRect(box.x + px(8), middle - rowHeight / 2, px(2), rowHeight);
    }

    context.font = fontOf(400)(NETWORK_STRIP.fontPx);
    context.fillStyle = look.ink3;
    context.fillText(formatClock(request.fromMs), left, middle);
    context.font = fontOf(500)(NETWORK_STRIP.fontPx);
    context.fillStyle = look.ink;
    context.fillText(
      fitText({ context, text: request.method, width: columns.method * ch }),
      methodX,
      middle,
    );

    context.beginPath();
    context.arc(statusX + dot, middle, dot, 0, Math.PI * 2);

    if (isDone) {
      context.fillStyle = tone;
      context.fill();
      context.fillText(
        fitText({
          context,
          text: codeOf({ request, words }),
          width: columns.status * ch - dot * 2 - px(5),
        }),
        statusX + dot * 2 + px(5),
        middle,
      );
    } else {
      context.strokeStyle = tone;
      context.lineWidth = px(1.2);
      context.stroke();
    }

    context.font = fontOf(400)(NETWORK_STRIP.fontPx);

    const host = fitText({ context, text: request.host ?? '', width: urlWidth });
    const hostWidth = host === '' ? 0 : context.measureText(host).width;

    context.fillStyle = look.ink3;

    if (host !== '') context.fillText(host, urlX, middle);

    context.fillStyle = look.ink;
    context.fillText(
      fitText({ context, text: request.path, width: urlWidth - hostWidth }),
      urlX + hostWidth,
      middle,
    );
    context.fillStyle = look.ink3;
    context.fillText(
      fitText({
        context,
        text: typeLabels[request.type] ?? request.type,
        width: columns.type * ch,
      }),
      typeX,
      middle,
    );

    context.fillStyle = look.line2;
    context.beginPath();
    context.roundRect(barX, middle - bar / 2, barWidth, bar, bar / 2);
    context.fill();
    context.fillStyle = tone;
    context.beginPath();
    context.roundRect(
      barX,
      middle - bar / 2,
      barWidth * requestBarOf(elapsedMs),
      bar,
      bar / 2,
    );
    context.fill();

    context.textAlign = 'right';
    context.fillStyle = look.ink2;
    context.fillText(
      formatRequestTime({ ms: elapsedMs, language: words.language }),
      timeRight,
      middle,
    );

    if (isDone && request.size !== null)
      context.fillText(
        formatRequestSize({ bytes: request.size, language: words.language }),
        right,
        middle,
      );

    context.textAlign = 'left';
  });

  context.globalAlpha = 1;
  context.restore();
}
