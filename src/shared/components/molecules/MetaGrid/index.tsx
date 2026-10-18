import type { IMetaGridProps } from './types';
import { Fragment } from 'react';
import './styles.css';

export const MetaGrid: React.FC<IMetaGridProps> = (props) => (
  <dl className="meta-grid">
    {props.rows.map((row) => (
      <Fragment key={row.key}>
        <dt className="meta-grid__key">{row.label}</dt>
        <dd className="meta-grid__value">{row.value}</dd>
      </Fragment>
    ))}
  </dl>
);
