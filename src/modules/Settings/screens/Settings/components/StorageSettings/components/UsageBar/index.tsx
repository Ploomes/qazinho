import type { IUsageBarProps } from './types';
import { motion } from 'motion/react';
import './styles.css';

/**
 * O disco do QAzinho numa barra de uma fatia por tipo, com a legenda embaixo que diz o
 * valor de cada uma: apontar uma acende a outra.
 */
export const UsageBar: React.FC<IUsageBarProps> = (props) => (
  <div className="usage-bar" onPointerLeave={props.onDeactivate}>
    {props.isPending ? (
      <div className="usage-bar__track usage-bar__track--pending" aria-hidden="true">
        <span className="usage-bar__bone" />
      </div>
    ) : (
      <motion.div
        key="track"
        className={
          props.isEmpty ? 'usage-bar__track usage-bar__track--empty' : 'usage-bar__track'
        }
        aria-hidden="true"
        variants={props.barMotion}
        initial="hidden"
        animate="shown"
      >
        {props.segments.map((segment) => (
          <motion.span
            key={segment.id}
            className={segment.segmentClassName}
            initial={false}
            animate={{ flexGrow: segment.bytes }}
            transition={props.growth}
            onPointerEnter={() => {
              props.onActivate(segment.id);
            }}
          />
        ))}
      </motion.div>
    )}

    <ul className="usage-bar__rows">
      {props.rows.map((row) => (
        <motion.li
          key={row.id}
          className={row.className}
          variants={props.itemMotion}
          onPointerEnter={() => {
            props.onActivate(row.id);
          }}
        >
          <span className={row.swatchClassName} aria-hidden="true" />
          <span className="usage-bar__label">{row.label}</span>
          {row.isPending ? (
            <>
              <span className="usage-bar__bone usage-bar__bone--size" />
              <span className="usage-bar__bone usage-bar__bone--share" />
            </>
          ) : (
            <>
              <span className="usage-bar__size">{row.size}</span>
              <span className="usage-bar__share">{row.share}</span>
            </>
          )}
        </motion.li>
      ))}
    </ul>
  </div>
);
