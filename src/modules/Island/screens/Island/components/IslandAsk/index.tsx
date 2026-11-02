import type { IIslandAskProps } from './types';
import { Button, Chip, Icon, IconButton, Input } from '@/shared/components/atoms';
import './styles.css';

/**
 * A pergunta de um agente na ilha aberta: de onde veio, as setas entre as que esperam,
 * e as opções e o campo para responder.
 */
export const IslandAsk: React.FC<IIslandAskProps> = (props) => (
  <div className="island-ask">
    <div className="island-ask__head">
      <span className="island-ask__title">{props.title}</span>
      {props.position !== null && (
        <span className="island-ask__nav">
          <IconButton
            icon="caretLeft"
            size="sm"
            label={props.previousLabel}
            onClick={props.onPrevious}
          />
          <span className="island-ask__position">{props.position}</span>
          <IconButton
            icon="caretRight"
            size="sm"
            label={props.nextLabel}
            onClick={props.onNext}
          />
        </span>
      )}
    </div>
    <div className="island-ask__status">
      <span className="island-ask__line">{props.line}</span>
      {props.canType && (
        <span className="island-ask__open">
          <Button size="sm" variant="ghost" onClick={props.onOpen}>
            {props.openLabel} <Icon name="arrow" />
          </Button>
        </span>
      )}
    </div>
    <p className="island-ask__question">{props.question}</p>
    {props.hasOptions && (
      <div className="island-ask__options" role="group" aria-label={props.question}>
        {props.options.map((option) => (
          <Chip key={option.label} onClick={option.onPick}>
            {option.label}
          </Chip>
        ))}
      </div>
    )}
    {props.secretNote !== null && (
      <p className="island-ask__secret">
        <Icon name="lock" /> {props.secretNote}
      </p>
    )}
    {props.canType && (
      <div className="island-ask__field">
        <div className="island-ask__input">
          <Input
            value={props.draft}
            label={props.fieldLabel}
            placeholder={props.fieldLabel}
            isCompact
            inputRef={props.fieldRef}
            onChange={props.onDraft}
            onPointerDown={props.onFieldPress}
            onBlur={props.onFieldBlur}
            onKeyDown={props.onFieldKeyDown}
          />
        </div>
        <Button
          size="sm"
          variant="primary"
          disabled={!props.canSend}
          onClick={props.onSend}
        >
          {props.sendLabel}
        </Button>
      </div>
    )}
    {!props.canType && (
      <div className="island-ask__actions">
        <Button size="sm" variant="primary" onClick={props.onOpen}>
          {props.openLabel}
        </Button>
      </div>
    )}
  </div>
);
