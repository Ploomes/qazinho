import { useEffect, useRef, useState } from 'react';
import { Sites } from '@/services';

export const useSiteIcons = (addresses: string[]) => {
  const [icons, setIcons] = useState<Record<string, string | null>>({});
  const asked = useRef(new Set<string>());
  const wanted = [...new Set(addresses)].sort().join('\n');

  useEffect(() => {
    for (const address of wanted.split('\n')) {
      if (address === '' || asked.current.has(address)) continue;

      asked.current.add(address);
      void Sites.icon(address).then((icon) => {
        setIcons((current) => ({ ...current, [address]: icon }));
      });
    }
  }, [wanted]);

  return icons;
};
