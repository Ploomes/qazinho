import type { ISkillCreatorProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, Input } from '@/shared/components/atoms';
import { SegmentedControl } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { STICKER } from '@/shared/constants';
import { useSkillCreatorViewModel } from './hooks';
import './styles.css';

/**
 * Uma skill escrita com o agente do QA: ele conta as regras ou anexa casos, o agente
 * pergunta o que falta e devolve a skill, que o editor abre para revisar.
 */
export const SkillCreator: React.FC<ISkillCreatorProps> = (props) => {
  const { talkRef, ...view } = useSkillCreatorViewModel(props);

  return (
    <ModalFrame
      title={view.title}
      width={view.width}
      height={view.height}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    >
      <div className="skill-creator">
        <SegmentedControl
          label={view.title}
          options={view.modes}
          value="agent"
          onChange={view.onMode}
        />

        <div ref={talkRef} className="skill-creator__talk">
          <p className="skill-creator__intro">{view.intro}</p>
          {view.talk.map((line) => (
            <motion.p
              key={line.id}
              className={`skill-creator__line skill-creator__line--${line.from}`}
              initial={STICKER.slap.initial}
              animate={STICKER.slap.animate}
            >
              {line.text}
            </motion.p>
          ))}

          <AnimatePresence initial={false}>
            {view.isWriting && (
              <motion.p
                key="writing"
                className="skill-creator__writing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {view.writingLabel}
              </motion.p>
            )}
          </AnimatePresence>

          {view.question !== null && (
            <div className="skill-creator__question">
              <span className="skill-creator__header">{view.question.header}</span>
              <span className="skill-creator__ask">{view.question.question}</span>
              {view.question.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="skill-creator__option"
                  onClick={option.onPick}
                >
                  <span className="skill-creator__option-label">{option.label}</span>
                  <span className="skill-creator__option-text">{option.description}</span>
                </button>
              ))}
              <Input
                label={view.otherLabel}
                placeholder={view.otherPlaceholder}
                value={view.other}
                isCompact
                onChange={view.onOther}
                onKeyDown={view.onOtherKeyDown}
              />
            </div>
          )}

          {view.skill !== null && (
            <div className="skill-creator__ready">
              <Icon name="sparkle" />
              <span className="skill-creator__ready-text">
                <span className="skill-creator__ready-title">{view.skill.title}</span>
                <span>{view.skill.description}</span>
              </span>
            </div>
          )}

          {view.error !== '' && <p className="skill-creator__error">{view.error}</p>}
        </div>

        <div className="skill-creator__composer">
          <textarea
            className="skill-creator__field"
            value={view.text}
            placeholder={view.placeholder}
            rows={3}
            onChange={view.onText}
            onKeyDown={view.onKeyDown}
          />
          <div className="skill-creator__tools">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void view.onAttach();
              }}
            >
              <Icon name="attach" />
              {view.attachLabel}
            </Button>
            {view.files.map((file) => (
              <span key={file} className="skill-creator__file">
                {file}
              </span>
            ))}
            {view.isWriting ? (
              <Button size="sm" onClick={view.onStop}>
                {view.stopLabel}
              </Button>
            ) : (
              <Button size="sm" disabled={!view.canSend} onClick={view.onSend}>
                {view.sendLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ModalFrame>
  );
};
