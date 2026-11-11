import type { IBugThumbProps } from '@/modules/Bug/screens/Bugs/components/BugThumb/types';
import { useShot } from '@/shared/hooks';

export const useBugThumbViewModel = (props: IBugThumbProps) => {
  const shot = useShot({ src: props.src, file: props.file });

  return { shot: shot ?? undefined, hasShot: shot !== null };
};
