import { useEffect, useState } from 'react';

export const useWindowWidth = (): number => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const follow = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', follow);

    return () => {
      window.removeEventListener('resize', follow);
    };
  }, []);

  return width;
};
