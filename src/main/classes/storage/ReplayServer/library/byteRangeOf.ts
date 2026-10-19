import type { ByteRange } from '@/main/classes/storage/ReplayServer/types';

/** The bytes a Range header asks of a file of `size` bytes, the way a <video> asks for them to seek. */
export function byteRangeOf(props: {
  header: string | undefined;
  size: number;
}): ByteRange {
  const { header, size } = props;

  if (header === undefined) return { kind: 'whole' };

  const asked = /^bytes=(\d*)-(\d*)$/.exec(header.trim());

  if (asked === null) return { kind: 'whole' };

  const [, from = '', to = ''] = asked;

  if (from === '' && to === '') return { kind: 'outside' };

  const start = from === '' ? Math.max(0, size - Number(to)) : Number(from);
  const end = from === '' || to === '' ? size - 1 : Math.min(Number(to), size - 1);

  return start > end || start >= size
    ? { kind: 'outside' }
    : { kind: 'slice', start, end };
}
