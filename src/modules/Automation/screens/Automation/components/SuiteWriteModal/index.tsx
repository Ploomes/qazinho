import type { ISuiteWriteModalProps } from './types';
import { IconButton } from '@/shared/components/atoms';
import { SearchList } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { useSuiteWriteModalViewModel } from './hooks';
import './styles.css';

/**
 * Asking the QA's agent for a new test of the team's suite: what it should check, the
 * plan case it automates, and where it goes.
 */
export const SuiteWriteModal: React.FC<ISuiteWriteModalProps> = (props) => {
  const {
    title,
    subtitle,
    width,
    rows,
    confirmLabel,
    canConfirm,
    hint,
    onConfirm,
    onCancel,
    whatLabel,
    placeholder,
    text,
    onText,
    fromLabel,
    fromNote,
    clearLabel,
    source,
    onClearSource,
    noCases,
    caseSearch,
    onCaseQuery,
    onPickCase,
    whereLabel,
    whereNote,
    folder,
    onClearFolder,
    folderSearch,
    onFolderQuery,
    onPickFolder,
  } = useSuiteWriteModalViewModel(props);

  return (
    <ModalFrame
      title={title}
      subtitle={subtitle}
      width={width}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      hint={hint}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="suite-write">
        <label className="suite-write__part">
          <span className="suite-write__label">{whatLabel}</span>
          <textarea
            className="suite-write__text"
            value={text}
            placeholder={placeholder}
            rows={rows}
            autoFocus
            onChange={onText}
          />
        </label>

        <section className="suite-write__part">
          <span className="suite-write__label">{fromLabel}</span>
          <span className="suite-write__note">{fromNote}</span>
          {source !== null ? (
            <span className="suite-write__picked">
              <span className="suite-write__picked-label">{source.label}</span>
              <span className="suite-write__picked-detail">{source.detail}</span>
              <IconButton
                icon="close"
                size="sm"
                label={clearLabel}
                onClick={onClearSource}
              />
            </span>
          ) : noCases !== '' ? (
            <span className="suite-write__note">{noCases}</span>
          ) : (
            <SearchList
              query={caseSearch.query}
              label={caseSearch.label}
              placeholder={caseSearch.placeholder}
              items={caseSearch.items}
              note={caseSearch.note}
              emptyText={caseSearch.emptyText}
              onQuery={onCaseQuery}
              onPick={onPickCase}
            />
          )}
        </section>

        <section className="suite-write__part">
          <span className="suite-write__label">{whereLabel}</span>
          {folder !== null ? (
            <span className="suite-write__picked">
              <span className="suite-write__picked-label">{folder}</span>
              <IconButton
                icon="close"
                size="sm"
                label={clearLabel}
                onClick={onClearFolder}
              />
            </span>
          ) : (
            <>
              <span className="suite-write__note">{whereNote}</span>
              <SearchList
                query={folderSearch.query}
                label={folderSearch.label}
                placeholder={folderSearch.placeholder}
                items={folderSearch.items}
                note={folderSearch.note}
                emptyText={folderSearch.emptyText}
                onQuery={onFolderQuery}
                onPick={onPickFolder}
              />
            </>
          )}
        </section>
      </div>
    </ModalFrame>
  );
};
