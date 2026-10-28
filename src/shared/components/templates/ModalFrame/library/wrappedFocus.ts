/**
 * Para onde o Tab vai a partir do último controle de um modal, ou o Shift+Tab a partir do
 * primeiro: dá a volta até a outra ponta.
 */
export function wrappedFocus<T>(props: {
  items: T[];
  current: T | null;
  isBack: boolean;
}): T | null {
  const { items, current, isBack } = props;
  const first = items[0] ?? null;
  const last = items.at(-1) ?? null;

  if (first === null || last === null) return null;

  if (current === null || !items.includes(current)) return isBack ? last : first;

  if (isBack && current === first) return last;

  if (!isBack && current === last) return first;

  return null;
}
