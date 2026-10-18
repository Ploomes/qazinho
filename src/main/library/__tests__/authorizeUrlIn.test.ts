import { describe, expect, it } from 'vitest';
import { authorizeUrlIn } from '@/main/library';

describe('authorizeUrlIn', () => {
  it('finds the sign-in address in what Codex printed', () => {
    expect(
      authorizeUrlIn(
        'Detected OAuth support. Starting OAuth flow…\nAuthorize `figma` by opening this URL in your browser:\nhttps://www.figma.com/oauth/mcp?response_type=code&client_id=x\n',
      ),
    ).toBe('https://www.figma.com/oauth/mcp?response_type=code&client_id=x');
  });

  it('does NOT take another address for the sign-in', () => {
    expect(
      authorizeUrlIn('Added global MCP server at https://mcp.figma.com/mcp'),
    ).toBeNull();
  });
});
