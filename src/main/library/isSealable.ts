const WEAK_STORES = ['basic_text', 'unknown'];

/**
 * Se o SO consegue lacrar um segredo: tem um keychain, e no Linux um armazenamento de
 * segredos de verdade em vez da chave fixa que o Electron usa sem um.
 */
export function isSealable(props: {
  platform: string;
  isAvailable: boolean;
  store: string | null;
}): boolean {
  if (!props.isAvailable) return false;

  return props.platform !== 'linux' || !WEAK_STORES.includes(props.store ?? 'unknown');
}
