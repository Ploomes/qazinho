import { useEffect, useState } from 'react';
import { scrollParentOf } from './library';

export const useToTop = () => {
  const [top, setTop] = useState<HTMLElement | null>(null);
  const [isAtTop, setAtTop] = useState(true);

  useEffect(() => {
    if (top === null || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => {
      setAtTop(entry?.isIntersecting ?? true);
    });

    observer.observe(top);

    return () => {
      observer.disconnect();
    };
  }, [top]);

  return {
    topRef: setTop,
    isToTopShown: !isAtTop,
    onToTop: () => {
      if (top === null) return;

      const scroller = scrollParentOf(top);

      if (scroller === null) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else scroller.scrollTo({ top: 0, behavior: 'smooth' });
    },
  };
};
