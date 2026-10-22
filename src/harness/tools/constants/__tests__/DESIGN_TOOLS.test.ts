import { describe, expect, it } from 'vitest';
import { DESIGN_TOOLS } from '@/harness/tools/constants';

describe('DESIGN_TOOLS', () => {
  it('only reads the design: no tool that writes to Figma or spends its credits', () => {
    for (const tool of DESIGN_TOOLS) expect(tool).toMatch(/^get_/);
  });
});
