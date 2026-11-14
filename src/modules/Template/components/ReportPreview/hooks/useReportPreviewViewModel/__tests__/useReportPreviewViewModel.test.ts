// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReportPreviewViewModel } from '@/modules/Template/components/ReportPreview/hooks';

describe('useReportPreviewViewModel', () => {
  it('keys each block by its kind and place, so two of a kind never clash', () => {
    const { result } = renderHook(() =>
      useReportPreviewViewModel({
        label: 'Preview',
        blocks: [
          { kind: 'paragraph', text: 'A' },
          { kind: 'paragraph', text: 'A' },
        ],
      }),
    );

    expect(result.current.blocks.map(({ key }) => key)).toEqual([
      'paragraph-0',
      'paragraph-1',
    ]);
  });
});
