import type { IBugThumbProps } from './types';
import { useBugThumbViewModel } from './hooks';

/** A tela de um bug em miniatura, na lista de bugs. */
export const BugThumb: React.FC<IBugThumbProps> = (props) => {
  const { shot, hasShot } = useBugThumbViewModel(props);

  return <span className="bugs__thumb">{hasShot && <img src={shot} alt="" />}</span>;
};
