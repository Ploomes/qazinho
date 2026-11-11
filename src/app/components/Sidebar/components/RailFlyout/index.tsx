import type { IRailFlyoutProps } from './types';
import { motion } from 'motion/react';
import { ProjectMark } from '@/modules/Project';
import { Icon } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useRailFlyoutViewModel } from './hooks';
import './styles.css';

/** Os planos de um projeto, num painel ao lado do ícone dele na barra recolhida. */
export const RailFlyout: React.FC<IRailFlyoutProps> = (props) => {
  const { style } = useRailFlyoutViewModel(props);

  return (
    <motion.div
      className="rail-flyout"
      role="menu"
      aria-label={props.flyout.name}
      style={style}
      initial={STICKER.slap.initial}
      animate={STICKER.slap.animate}
      exit={STICKER.slap.exit}
      onPointerEnter={props.onKeep}
      onPointerLeave={props.onLeave}
    >
      <header className="rail-flyout__head">
        <ProjectMark mark={props.flyout.mark} size={props.markSize} />
        <span className="rail-flyout__name">{props.flyout.name}</span>
        <span className="rail-flyout__place">{props.flyout.place}</span>
        <button
          type="button"
          className="rail-flyout__tool"
          aria-label={props.settingsLabel}
          title={props.settingsLabel}
          onClick={() => {
            props.onSettings(props.flyout.projectId);
          }}
        >
          <Icon name="settings" size={14} />
        </button>
      </header>

      {props.flyout.plans.map((plan) => (
        <button
          key={plan.id}
          type="button"
          role="menuitem"
          className={
            plan.isSelected
              ? 'rail-flyout__plan rail-flyout__plan--selected'
              : 'rail-flyout__plan'
          }
          aria-label={plan.label}
          onClick={() => {
            props.onPlan(plan.id);
          }}
        >
          <span className="rail-flyout__plan-name">{plan.name}</span>
          {plan.signal !== null && (
            <span
              className="rail-flyout__signal"
              title={plan.signal.label}
              style={{ color: plan.signal.tone, animation: plan.signal.animation }}
            >
              <Icon name={plan.signal.icon} />
            </span>
          )}
        </button>
      ))}

      <button
        type="button"
        role="menuitem"
        className="rail-flyout__new"
        onClick={() => {
          props.onNew(props.flyout.projectId);
        }}
      >
        <Icon name="plus" size={14} />
        {props.newLabel}
      </button>
    </motion.div>
  );
};
