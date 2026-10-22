import type { IBugCardProps } from './types';
import { useTranslation } from 'react-i18next';
import { Button, Caret, Eyebrow, Icon } from '@/shared/components/atoms';
import { ExpectedGot, MetaGrid, Screenshot } from '@/shared/components/molecules';
import { MomentTile } from './components';
import { useBugCardViewModel } from './hooks';
import './styles.css';

export const BugCard: React.FC<IBugCardProps> = (props) => {
  const {
    hasBody,
    severity,
    meta,
    shots,
    moment,
    shotsStyle,
    hasRun,
    newLabel,
    openRunLabel,
    filedKey,
    sendLabel,
    openIssueLabel,
    canCopyScreen,
    copyLabel,
    onHeadClick,
    onOpenRunClick,
    onSendClick,
    onOpenIssue,
    onCopyScreen,
    onOpenShot,
  } = useBugCardViewModel(props);
  const { bug } = props;
  const { t } = useTranslation();

  return (
    <article className="bug-card">
      <button type="button" className="bug-card__head" onClick={onHeadClick}>
        <span
          className={
            bug.isNew
              ? 'bug-card__severity bug-card__severity--new'
              : 'bug-card__severity'
          }
          aria-hidden="true"
        />
        <span className="bug-card__id">{bug.id}</span>
        <span className="bug-card__title">{bug.title}</span>
        {bug.isIncidental && (
          <span className="bug-card__outside">{t('BUG.OUTSIDE_PLAN')}</span>
        )}
        {filedKey !== null && (
          <span className="bug-card__filed">
            <Icon name="link" />
            {filedKey}
          </span>
        )}
        {bug.isNew && <span className="bug-card__new">{newLabel}</span>}
        <span className="bug-card__id">{severity}</span>
        <Caret isOpen={props.isOpen} />
      </button>

      {props.isOpen && (
        <div className="bug-card__body">
          {hasBody && <p className="bug-card__text">{bug.body}</p>}

          <div>
            <Eyebrow>{t('BUG.WHERE')}</Eyebrow>
            <MetaGrid rows={meta} />
          </div>

          <div>
            <Eyebrow>{t('BUG.SCREENSHOTS')}</Eyebrow>
            <div className="bug-card__shots" style={shotsStyle}>
              {shots.map((shot) => (
                <Screenshot
                  key={shot.label}
                  label={shot.label}
                  src={shot.src}
                  file={shot.file}
                  isBad={shot.isBad}
                  size="shot"
                  onOpen={() => {
                    onOpenShot(shot);
                  }}
                />
              ))}
              {moment !== null && <MomentTile bugId={bug.id} moment={moment} />}
            </div>
          </div>

          <div>
            <Eyebrow>{t('BUG.HOW_TO')}</Eyebrow>
            <ol className="bug-card__repro">
              {bug.repro.map((step) => (
                <li
                  key={step.action}
                  className={step.isBad ? 'bug-card__repro-step--bad' : undefined}
                >
                  {step.action}
                </li>
              ))}
            </ol>
          </div>

          <ExpectedGot isBug expected={bug.expected} got={bug.got} />

          <div className="bug-card__actions">
            {hasRun && (
              <Button size="sm" onClick={onOpenRunClick}>
                {openRunLabel}
              </Button>
            )}
            <Button size="sm" onClick={props.onOpenCase}>
              {t('BUG.OPEN_CASE', { id: bug.caseId })}
            </Button>
            <span className="bug-card__tracker">
              {filedKey === null ? (
                <Button size="sm" variant="primary" onClick={onSendClick}>
                  <Icon name="send" />
                  {sendLabel}
                </Button>
              ) : (
                <>
                  {canCopyScreen && (
                    <Button size="sm" onClick={onCopyScreen}>
                      <Icon name="copy" />
                      {copyLabel}
                    </Button>
                  )}
                  <Button size="sm" onClick={onOpenIssue}>
                    {openIssueLabel}
                    <Icon name="external" />
                  </Button>
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </article>
  );
};
