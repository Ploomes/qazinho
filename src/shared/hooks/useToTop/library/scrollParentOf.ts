/** O primeiro ancestral que rola por conta própria, ou null quando nenhum rola. */
export function scrollParentOf(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;

  while (parent !== null) {
    if (isScroller(parent)) return parent;

    parent = parent.parentElement;
  }

  return null;
}

function isScroller(element: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(element);

  return overflowY === 'auto' || overflowY === 'scroll';
}
