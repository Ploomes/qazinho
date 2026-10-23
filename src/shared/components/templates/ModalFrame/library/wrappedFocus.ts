/** Where Tab goes from the last thing in a modal, or Shift+Tab from the first: round to the other end, so focus never leaves the modal for what sits behind it; null when the browser's own move stays inside. */
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
