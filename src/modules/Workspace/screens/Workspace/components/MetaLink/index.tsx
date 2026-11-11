import type { IMetaLinkProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { useMetaLinkViewModel } from './hooks';
import './styles.css';

/** Um link da frase do cabeçalho que sai do app, e o botão que o solta quando dá. */
export const MetaLink: React.FC<IMetaLinkProps> = (props) => {
  const { canDrop, dropLabel, onDropClick } = useMetaLinkViewModel(props);

  return (
    <span className="meta-link">
      <a
        className="meta-link__anchor"
        href={props.href}
        target="_blank"
        rel="noreferrer"
        title={props.title}
      >
        {props.children}
        <Icon name="external" />
      </a>
      {canDrop && (
        <Tooltip content={dropLabel}>
          <button
            type="button"
            className="meta-link__drop"
            aria-label={dropLabel}
            onClick={onDropClick}
          >
            <Icon name="close" />
          </button>
        </Tooltip>
      )}
    </span>
  );
};
