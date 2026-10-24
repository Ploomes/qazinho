import type { ProAnswer } from '@/main/classes/pro/ProApi/types';
import type { z } from 'zod';

/** Reads the platform's answer against the shape it promised: its error code when it refused, `unexpected` when the shape is off. */
export async function answerOf<T>(props: {
  response: { ok: boolean; status: number; text: () => Promise<string> };
  schema: z.ZodType<T>;
}): Promise<ProAnswer<T>> {
  const { response, schema } = props;
  const body = bodyOf(await response.text());

  if (!response.ok) {
    const isEnvelope = typeof body === 'object' && body !== null && 'error' in body;
    const error = isEnvelope ? String(body.error) : `http_${String(response.status)}`;
    const details = isEnvelope && 'details' in body ? body.details : undefined;

    return details === undefined
      ? { isOk: false, status: response.status, error }
      : { isOk: false, status: response.status, error, details };
  }

  const read = schema.safeParse(body);

  return read.success
    ? { isOk: true, value: read.data }
    : { isOk: false, status: response.status, error: 'unexpected' };
}

function bodyOf(text: string): unknown {
  try {
    return text === '' ? null : (JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}
