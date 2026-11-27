import { describe, expect, it } from 'vitest';
import { isOpenableUrl } from '@/main/library';

describe('isOpenableUrl', () => {
  it('opens a page on the web', () => {
    expect(isOpenableUrl('https://qazinho.test/device')).toBe(true);
    expect(isOpenableUrl('https://www.figma.com/oauth?client_id=x')).toBe(true);
  });

  it('opens plain http only on this machine, where the web runs in development', () => {
    expect(isOpenableUrl('http://localhost:5180/device')).toBe(true);
    expect(isOpenableUrl('http://127.0.0.1:3100/x')).toBe(true);
    expect(isOpenableUrl('http://[::1]:5180/x')).toBe(true);
    expect(isOpenableUrl('http://example.com/login')).toBe(false);
  });

  // Um agente, um servidor MCP ou uma API comprometida pode pedir para abrir qualquer
  // coisa: no Windows, esquemas como ms-msdt: e search-ms: já executaram código.
  it('refuses every other scheme, which the system would hand to some program', () => {
    expect(isOpenableUrl('file:///etc/passwd')).toBe(false);
    expect(isOpenableUrl('ms-msdt:/id PCWDiagnostic')).toBe(false);
    expect(isOpenableUrl('search-ms:query=x&crumb=location:\\\\evil\\share')).toBe(false);
    expect(isOpenableUrl('smb://evil.test/share')).toBe(false);
    expect(isOpenableUrl('javascript:alert(1)')).toBe(false);
    expect(isOpenableUrl('qazinho://open?org=x')).toBe(false);
  });

  it('refuses an address with credentials in it, or one that is not an address', () => {
    expect(isOpenableUrl('https://user:pass@qazinho.test')).toBe(false);
    expect(isOpenableUrl('not a url')).toBe(false);
    expect(isOpenableUrl('')).toBe(false);
  });
});
