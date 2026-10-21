import type { IMp4Track } from '@/modules/Run/classes/video/ReplayComposer/types';

interface IBox {
  type: string;
  start: number;
  end: number;
}

const ENTRY_FIELDS = 78;

function fourCcAt(props: { view: DataView; at: number }): string {
  const { view, at } = props;

  return String.fromCharCode(
    view.getUint8(at),
    view.getUint8(at + 1),
    view.getUint8(at + 2),
    view.getUint8(at + 3),
  );
}

function boxesIn(props: { view: DataView; start: number; end: number }): IBox[] {
  const { view, end } = props;
  const boxes: IBox[] = [];
  let at = props.start;

  while (at + 8 <= end) {
    const declared = view.getUint32(at);
    const type = fourCcAt({ view, at: at + 4 });
    const header = declared === 1 ? 16 : 8;
    const size =
      declared === 1
        ? Number(view.getBigUint64(at + 8))
        : declared === 0
          ? end - at
          : declared;

    if (size < header || at + size > end) break;

    boxes.push({ type, start: at + header, end: at + size });
    at += size;
  }

  return boxes;
}

function childOf(props: { view: DataView; box: IBox | undefined; type: string }) {
  const { view, box, type } = props;

  return box === undefined
    ? undefined
    : boxesIn({ view, start: box.start, end: box.end }).find((one) => one.type === type);
}

function tableOf(props: { view: DataView; box: IBox | undefined; width: number }) {
  const { view, box, width } = props;

  if (box === undefined) return [];

  const count = view.getUint32(box.start + 4);

  return Array.from({ length: count }, (_, index) => {
    const at = box.start + 8 + index * width * 4;

    return Array.from({ length: width }, (__, field) => view.getUint32(at + field * 4));
  });
}

function hexOf(byte: number | undefined): string {
  return (byte ?? 0).toString(16).padStart(2, '0');
}

/** The H.264 video track of an MP4, with each frame's place in the file and its time; null for a file that holds none. */
export function readMp4(bytes: Uint8Array): IMp4Track | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  try {
    const moov = boxesIn({ view, start: 0, end: bytes.byteLength }).find(
      ({ type }) => type === 'moov',
    );
    const traks = moov === undefined ? [] : boxesIn({ view, ...moov });
    const mdia = traks
      .filter(({ type }) => type === 'trak')
      .map((trak) => childOf({ view, box: trak, type: 'mdia' }))
      .find((box) => {
        const hdlr = childOf({ view, box, type: 'hdlr' });

        return hdlr !== undefined && fourCcAt({ view, at: hdlr.start + 8 }) === 'vide';
      });
    const mdhd = childOf({ view, box: mdia, type: 'mdhd' });
    const stbl = childOf({
      view,
      box: childOf({ view, box: mdia, type: 'minf' }),
      type: 'stbl',
    });
    const stsd = childOf({ view, box: stbl, type: 'stsd' });

    if (mdhd === undefined || stbl === undefined || stsd === undefined) return null;

    const [entry] = boxesIn({ view, start: stsd.start + 8, end: stsd.end });

    if (entry === undefined || (entry.type !== 'avc1' && entry.type !== 'avc3'))
      return null;

    const avcC = boxesIn({
      view,
      start: entry.start + ENTRY_FIELDS,
      end: entry.end,
    }).find(({ type }) => type === 'avcC');

    if (avcC === undefined) return null;

    const description = bytes.slice(avcC.start, avcC.end);
    const timescale = view.getUint32(
      mdhd.start + (view.getUint8(mdhd.start) === 1 ? 20 : 12),
    );
    const box = (type: string) => childOf({ view, box: stbl, type });
    const stsz = box('stsz');
    const constant = stsz === undefined ? 0 : view.getUint32(stsz.start + 4);
    const sizes =
      stsz === undefined
        ? []
        : Array.from({ length: view.getUint32(stsz.start + 8) }, (_, index) =>
            constant > 0 ? constant : view.getUint32(stsz.start + 12 + index * 4),
          );
    const co64 = box('co64');
    const stco = box('stco');
    const chunks =
      co64 !== undefined
        ? Array.from({ length: view.getUint32(co64.start + 4) }, (_, index) =>
            Number(view.getBigUint64(co64.start + 8 + index * 8)),
          )
        : tableOf({ view, box: stco, width: 1 }).map(([offset = 0]) => offset);
    const perChunk = tableOf({ view, box: box('stsc'), width: 3 });
    const deltas = tableOf({ view, box: box('stts'), width: 2 }).flatMap(
      ([count = 0, delta = 0]) => Array.from({ length: count }, () => delta),
    );
    const ctts = box('ctts');
    const isSigned = ctts !== undefined && view.getUint8(ctts.start) === 1;
    const shifts = tableOf({ view, box: ctts, width: 2 }).flatMap(
      ([count = 0, shift = 0]) =>
        Array.from({ length: count }, () => (isSigned ? shift | 0 : shift)),
    );
    const stss = box('stss');
    const keys =
      stss === undefined
        ? null
        : new Set(
            tableOf({ view, box: stss, width: 1 }).map(([number = 0]) => number - 1),
          );
    const offsets: number[] = [];

    for (const [index, first] of chunks.entries()) {
      const count =
        perChunk.findLast(([firstChunk = 1]) => firstChunk <= index + 1)?.[1] ?? 0;
      let place = first;

      for (let taken = 0; taken < count && offsets.length < sizes.length; taken += 1) {
        offsets.push(place);
        place += sizes[offsets.length - 1] ?? 0;
      }
    }

    let decodeAt = 0;

    return {
      codec: `avc1.${hexOf(description[1])}${hexOf(description[2])}${hexOf(description[3])}`,
      description,
      width: view.getUint16(entry.start + 24),
      height: view.getUint16(entry.start + 26),
      samples: sizes.map((size, index) => {
        const delta = deltas[index] ?? 0;
        const shownAt = decodeAt + (shifts[index] ?? 0);

        decodeAt += delta;

        return {
          offset: offsets[index] ?? 0,
          size,
          timestampUs: Math.round((shownAt * 1e6) / timescale),
          durationUs: Math.round((delta * 1e6) / timescale),
          isKey: keys === null || keys.has(index),
        };
      }),
    };
  } catch {
    return null;
  }
}
