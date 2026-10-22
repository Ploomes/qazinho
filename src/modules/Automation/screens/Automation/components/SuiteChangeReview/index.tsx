import type { ISuiteChangeReviewProps } from './types';
import { SuiteDiff } from '@/modules/Automation/screens/Automation/components/SuiteDiff';
import { Button, Eyebrow, Icon, Markdown } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { useSuiteChangeReviewViewModel } from './hooks';
import './styles.css';

/** The agent's fix as the QA reviews it before it leaves their machine: what it said, QAzinho's own run of the test, the pull request it wrote and every file it changed. */
export const SuiteChangeReview: React.FC<ISuiteChangeReviewProps> = (props) => {
  const {
    title,
    subtitle,
    width,
    height,
    confirmLabel,
    canConfirm,
    hint,
    onConfirm,
    onCancel,
    branch,
    from,
    summary,
    check,
    pullRequest,
    filesLabel,
    files,
    canDiscard,
    discardLabel,
    onDiscard,
  } = useSuiteChangeReviewViewModel(props);

  return (
    <ModalFrame
      title={title}
      subtitle={subtitle}
      width={width}
      height={height}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      hint={hint}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="suite-change-review">
        <div className="suite-change-review__meta">
          <span className="suite-change-review__branch">
            <Icon name="branch" /> {branch}
          </span>
          <span className="suite-change-review__from">{from}</span>
        </div>

        {summary !== '' && <p className="suite-change-review__summary">{summary}</p>}

        <span className={check.className}>
          <Icon name={check.icon} /> {check.text}
        </span>

        {pullRequest !== null && (
          <section className="suite-change-review__pull-request">
            <Eyebrow>{pullRequest.label}</Eyebrow>
            <strong className="suite-change-review__pull-request-title">
              {pullRequest.title}
            </strong>
            {pullRequest.body !== '' && (
              <div className="suite-change-review__pull-request-body">
                <Markdown>{pullRequest.body}</Markdown>
              </div>
            )}
          </section>
        )}

        <section className="suite-change-review__files">
          <Eyebrow>{filesLabel}</Eyebrow>
          {files.map((item) => (
            <SuiteDiff
              key={item.key}
              file={item.file}
              isOpenAtFirst={item.isOpenAtFirst}
            />
          ))}
        </section>

        {canDiscard && (
          <div className="suite-change-review__discard">
            <Button size="sm" variant="danger-quiet" onClick={onDiscard}>
              {discardLabel}
            </Button>
          </div>
        )}
      </div>
    </ModalFrame>
  );
};
