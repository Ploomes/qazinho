import type { IInternProps } from './types';
import { useInternViewModel } from './hooks';
import './styles.css';

export const Intern: React.FC<IInternProps> = (props) => {
  const { alt, style } = useInternViewModel(props);

  return (
    <span key={props.mood} className="intern" role="img" aria-label={alt} style={style} />
  );
};
