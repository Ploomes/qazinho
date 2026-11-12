import type {
  IStripLook,
  IStripWords,
  StripCanvas,
} from '@/modules/Run/classes/video/ReplayComposer/types';
import type { IReplayRequest } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { drawNetworkStrip } from '@/modules/Run/classes/video/ReplayComposer/library';

interface IWritten {
  text: string;
  x: number;
  y: number;
  colour: string;
  alpha: number;
  align: string;
}

/**
 * Um canvas que só anota o que foi escrito nele, cada glifo com seis pixels de largura.
 */
function fakeCanvas() {
  const written: IWritten[] = [];
  const canvas = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    letterSpacing: '0px',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    save: () => undefined,
    restore: () => undefined,
    beginPath: () => undefined,
    rect: () => undefined,
    clip: () => undefined,
    roundRect: () => undefined,
    arc: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    fill: () => undefined,
    stroke: () => undefined,
    fillRect: () => undefined,
    fillText(...[text, x, y]: [string, number, number]) {
      written.push({
        text,
        x,
        y,
        colour: this.fillStyle,
        alpha: this.globalAlpha,
        align: this.textAlign,
      });
    },
    measureText: (text: string) => ({ width: text.length * 6 }),
  };

  return { context: canvas as unknown as StripCanvas, written };
}

const LOOK: IStripLook = {
  screen: 'screen',
  panel: 'panel',
  line: 'line',
  line2: 'line2',
  ink: 'ink',
  ink2: 'ink2',
  ink3: 'ink3',
  pass: 'pass',
  attn: 'attn',
  fail: 'fail',
  failSoft: 'fail-soft',
  lime: 'lime',
  limeInk: 'lime-ink',
  limeSoft: 'lime-soft',
};

const WORDS: IStripWords = {
  title: 'Network',
  count: ({ shown, total }) => `${String(shown)} of ${String(total)}`,
  errors: (count) => (count === 1 ? '1 error' : `${String(count)} errors`),
  failed: 'failed',
  canceled: 'canceled',
  empty: 'Nothing went over the network yet.',
  language: 'en',
};

const request = (props: Partial<IReplayRequest>): IReplayRequest => ({
  id: 1,
  method: 'GET',
  url: 'https://shop.test/',
  host: null,
  path: '/',
  type: 'fetch',
  isApi: true,
  outcome: 'ok',
  status: 200,
  failure: null,
  fromMs: 0,
  toMs: 120,
  durationMs: 120,
  size: 1_884,
  body: null,
  ...props,
});

const REQUESTS = [
  request({ id: 1 }),
  request({
    id: 2,
    method: 'POST',
    type: 'fetch',
    path: '/api/checkout',
    outcome: 'server',
    status: 500,
    fromMs: 4_000,
    toMs: 4_430,
    durationMs: 430,
    size: 210,
  }),
  request({
    id: 3,
    type: 'fetch',
    path: '/api/stock',
    fromMs: 5_000,
    toMs: 6_400,
    durationMs: 1_400,
    size: 31,
  }),
];

function draw(props: { atMs: number; requests?: IReplayRequest[]; height?: number }) {
  const { context, written } = fakeCanvas();

  drawNetworkStrip({
    context,
    box: { x: 0, y: 800, width: 1280, height: props.height ?? 230 },
    scale: 1,
    requests: props.requests ?? REQUESTS,
    atMs: props.atMs,
    isShowingAll: false,
    look: LOOK,
    words: WORDS,
  });

  return written;
}

const texts = (written: IWritten[]) => written.map(({ text }) => text);

describe('drawNetworkStrip', () => {
  it('heads the strip with its name, the count so far and the moment of the video', () => {
    expect(texts(draw({ atMs: 4_200 }))).toEqual(
      expect.arrayContaining(['NETWORK', '2 of 3', '0:04.2']),
    );
  });

  it('writes a request as the video reaches it, and none before', () => {
    const shown = texts(draw({ atMs: 4_200 }));

    expect(shown).toContain('/api/checkout');
    expect(shown).not.toContain('/api/stock');
  });

  it('writes the status code in the colour of its class once the answer came', () => {
    const code = draw({ atMs: 5_000 }).find(({ text }) => text === '500');

    expect(code?.colour).toBe('fail');
    expect(texts(draw({ atMs: 5_000 }))).toContain('1 error');
  });

  it('writes no code and no size for a request still waiting, only how long so far', () => {
    const shown = texts(draw({ atMs: 5_600 }));

    expect(shown).toContain('600 ms');
    expect(shown).not.toContain('31 B');
  });

  it('fades a request in as it starts, then holds it whole', () => {
    const arriving = draw({ atMs: 5_100 }).find(({ text }) => text === '/api/stock');
    const settled = draw({ atMs: 6_000 }).find(({ text }) => text === '/api/stock');

    expect(arriving?.alpha).toBeGreaterThan(0);
    expect(arriving?.alpha).toBeLessThan(1);
    expect(settled?.alpha).toBe(1);
  });

  it('keeps only the rows that fit, the latest at the bottom', () => {
    const shown = draw({ atMs: 7_000, height: 32 + 22 * 2 + 8 }).filter(({ text }) =>
      text.startsWith('/'),
    );

    expect(shown.map(({ text }) => text)).toEqual(['/api/checkout', '/api/stock']);
    expect(shown[1]?.y).toBeGreaterThan(shown[0]?.y ?? 0);
  });

  it('cuts a long address to its column with an ellipsis', () => {
    const long = `/api/${'very-long-segment/'.repeat(30)}end`;
    const path = draw({
      atMs: 1_000,
      requests: [request({ path: long })],
    }).find(({ text }) => text.startsWith('/api/'));

    expect(path?.text.endsWith('…')).toBe(true);
    expect(path?.text.length).toBeLessThan(long.length);
  });

  it('writes a request that left the app with its host, dimmer than its path', () => {
    const written = draw({
      atMs: 1_000,
      requests: [request({ host: 'stats.test', path: '/collect' })],
    });

    expect(written.find(({ text }) => text === 'stats.test')?.colour).toBe('ink3');
    expect(written.find(({ text }) => text === '/collect')?.colour).toBe('ink');
  });

  it('says a failure in words', () => {
    expect(
      texts(
        draw({
          atMs: 1_000,
          requests: [
            request({ outcome: 'failed', status: null, failure: 'net::ERR_FAILED' }),
          ],
        }),
      ),
    ).toContain('failed');
  });

  it('says nothing went over the network before the first request', () => {
    expect(texts(draw({ atMs: 0, requests: [request({ fromMs: 3_000 })] }))).toContain(
      'Nothing went over the network yet.',
    );
  });
});
