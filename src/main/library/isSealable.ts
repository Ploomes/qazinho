const WEAK_STORES = ['basic_text', 'unknown'];

/** Whether the OS can seal a secret: it has a keychain, and on Linux a real secret store rather than the fixed key Electron falls back to without one. */
export function isSealable(props: {
  platform: string;
  isAvailable: boolean;
  store: string | null;
}): boolean {
  if (!props.isAvailable) return false;

  return props.platform !== 'linux' || !WEAK_STORES.includes(props.store ?? 'unknown');
}
