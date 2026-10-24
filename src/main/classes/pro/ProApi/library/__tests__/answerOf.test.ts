import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { answerOf } from '@/main/classes/pro/ProApi/library';

const responseOf = (props: { ok: boolean; status: number; text: string }) => ({
  ok: props.ok,
  status: props.status,
  text: () => Promise.resolve(props.text),
});

const SHAPE = z.object({ slug: z.string() });

describe('answerOf', () => {
  it('reads a body that keeps the promised shape', async () => {
    const answer = await answerOf({
      response: responseOf({ ok: true, status: 200, text: '{"slug":"loja"}' }),
      schema: SHAPE,
    });

    expect(answer).toEqual({ isOk: true, value: { slug: 'loja' } });
  });

  it('says the shape is off rather than handing back what the platform did not promise', async () => {
    const answer = await answerOf({
      response: responseOf({ ok: true, status: 200, text: '{"name":"Loja"}' }),
      schema: SHAPE,
    });

    expect(answer).toEqual({ isOk: false, status: 200, error: 'unexpected' });
  });

  it('keeps the error code the platform refused with', async () => {
    const answer = await answerOf({
      response: responseOf({
        ok: false,
        status: 400,
        text: '{"error":"authorization_pending"}',
      }),
      schema: SHAPE,
    });

    expect(answer).toEqual({ isOk: false, status: 400, error: 'authorization_pending' });
  });

  it('keeps the details a refusal carries, such as the version a plan moved to', async () => {
    const answer = await answerOf({
      response: responseOf({
        ok: false,
        status: 409,
        text: '{"error":"plan_conflict","details":{"version":4}}',
      }),
      schema: SHAPE,
    });

    expect(answer).toEqual({
      isOk: false,
      status: 409,
      error: 'plan_conflict',
      details: { version: 4 },
    });
  });

  it('names a refusal with no body by its status', async () => {
    const answer = await answerOf({
      response: responseOf({ ok: false, status: 502, text: '<html>bad gateway</html>' }),
      schema: SHAPE,
    });

    expect(answer).toEqual({ isOk: false, status: 502, error: 'http_502' });
  });

  it('reads an empty answer as null, for a call that answers nothing', async () => {
    const answer = await answerOf({
      response: responseOf({ ok: true, status: 204, text: '' }),
      schema: z.null(),
    });

    expect(answer).toEqual({ isOk: true, value: null });
  });
});
