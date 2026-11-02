import { describe, expect, it } from 'vitest';
import { SIDEBAR_SIZE } from '@/app/components/Sidebar/constants';
import { SHELL } from '@/shared/constants';

describe('SIDEBAR_SIZE', () => {
  it('fits a tile inside the folded sidebar with room to breathe on both sides', () => {
    expect(SIDEBAR_SIZE.tile).toBeLessThan(SHELL.sidebarRail);
    expect(SHELL.sidebarRail - SIDEBAR_SIZE.tile).toBeGreaterThanOrEqual(16);
  });

  it('keeps the project avatar smaller than the tile that stands for it when folded', () => {
    expect(SIDEBAR_SIZE.avatar).toBeLessThan(SIDEBAR_SIZE.tile);
  });

  it('keeps the caret column and the avatar column well inside the width of the sidebar', () => {
    expect(SIDEBAR_SIZE.lead).toBeLessThan(SIDEBAR_SIZE.avatar);
    expect(SIDEBAR_SIZE.lead + SIDEBAR_SIZE.avatar).toBeLessThan(SHELL.sidebarWidth / 4);
  });
});
