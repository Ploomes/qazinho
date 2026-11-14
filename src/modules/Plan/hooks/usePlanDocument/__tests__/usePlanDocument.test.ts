// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { usePlanDocument } from '@/modules/Plan/hooks/usePlanDocument';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('usePlanDocument', () => {
  it("writes a workspace's plan as the page the QA publishes, in their words", () => {
    const { result } = renderHook(() => usePlanDocument());
    const blocks = result.current.documentOf(makeWorkspace());

    expect(blocks[0]).toEqual({
      kind: 'paragraph',
      text: expect.stringContaining('The test plan:') as unknown,
    });
    expect(blocks.some((block) => block.kind === 'heading')).toBe(true);
  });

  it('names a page after its workspace', () => {
    const { result } = renderHook(() => usePlanDocument());

    expect(result.current.titleOf('Checkout')).toBe('Test plan: Checkout');
  });
});
