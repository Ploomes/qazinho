import type { IProjectMarkProps } from './types';
import { PlatformIcon } from '@/shared/components/atoms';
import { useProjectMarkViewModel } from './hooks';
import './styles.css';

/** O app de um projeto num quadrado: o ícone do site, a plataforma ou a inicial. */
export const ProjectMark: React.FC<IProjectMarkProps> = (props) => {
  const { className, style, src, platform, initial, glyphSize } =
    useProjectMarkViewModel(props);

  return (
    <span className={className} style={style} aria-hidden="true">
      {src !== null && <img className="project-mark__icon" src={src} alt="" />}
      {platform !== null && <PlatformIcon kind={platform} size={glyphSize} />}
      {initial}
    </span>
  );
};
