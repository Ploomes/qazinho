import { useEffect, useState } from 'react';
import { Archive } from '@/services';

export const useShot = (props: { src: string | null; file: string | null }) => {
  const [read, setRead] = useState<{ file: string; shot: string | null } | null>(null);
  const { src, file } = props;

  useEffect(() => {
    if (src !== null || file === null) return;

    let wanted = true;

    void Archive.readShot(file).then((shot) => {
      if (wanted) setRead({ file, shot });
    });

    return () => {
      wanted = false;
    };
  }, [src, file]);

  return src ?? (read?.file === file ? read.shot : null);
};
