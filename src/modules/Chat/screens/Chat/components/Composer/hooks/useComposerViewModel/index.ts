import type { IComposerProps } from '@/modules/Chat/screens/Chat/components/Composer/types';
import type { IChatReference } from '@/shared/types';
import type { ChangeEvent, ClipboardEvent, DragEvent, KeyboardEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { splitMentions } from '@/modules/Chat/library';
import { MENTION_TABS } from '@/modules/Chat/screens/Chat/components/Composer/constants';
import { MOTION } from '@/shared/constants';

export const useComposerViewModel = (props: IComposerProps) => {
  const {
    value,
    mentions,
    mentionQuery,
    lockedText,
    isAnswering,
    onChange,
    onSend,
    onStop,
    onPickMention,
    command,
    commandPicker,
    onPickCommand,
    onCommandBack,
    onCommandCancel,
  } = props;
  const { t } = useTranslation();
  const [highlight, setHighlight] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const [chosenTab, setChosenTab] = useState<IChatReference['kind'] | null>(null);
  const [commandHighlight, setCommandHighlight] = useState(0);
  const [commandDismissedAt, setCommandDismissedAt] = useState<string | null>(null);
  const [isDropping, setDropping] = useState(false);

  const isLocked = lockedText !== null;
  const canAttach = !isLocked && !props.isAttaching && props.canAttachFiles !== false;
  const canSend =
    !isLocked &&
    !isAnswering &&
    !props.isAttaching &&
    (command === null
      ? value.trim().length > 0 || props.attachments.length > 0
      : command.isReady);
  const isCommandOpen =
    !isLocked &&
    commandPicker !== null &&
    (command !== null || commandDismissedAt !== value);
  const commandRows = commandPicker?.rows ?? [];
  const commandActive = Math.min(commandHighlight, Math.max(0, commandRows.length - 1));
  const isPickerOpen =
    !isLocked && !isCommandOpen && mentionQuery !== null && dismissedAt !== value;
  const filled = MENTION_TABS.filter((kind) =>
    mentions.some((mention) => mention.kind === kind),
  );
  const tab =
    chosenTab !== null && filled.includes(chosenTab) ? chosenTab : (filled[0] ?? 'case');
  const shown = mentions.filter((mention) => mention.kind === tab);
  const highlighted = Math.min(highlight, shown.length - 1);

  const onSendClick = () => {
    if (canSend) onSend();
  };

  const showTab = (kind: IChatReference['kind']) => {
    setChosenTab(kind);
    setHighlight(0);
  };

  const pick = (id: string) => {
    setHighlight(0);
    setChosenTab(null);
    onPickMention(id);
  };

  const pickCommand = (id: string) => {
    setCommandHighlight(0);
    onPickCommand(id);
  };

  const onCommandKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    const picked = commandRows[commandActive];

    if (event.key === 'Escape') {
      if (command === null) setCommandDismissedAt(value);
      else onCommandCancel();
    } else if (commandRows.length === 0) return event.key === 'Enter';
    else if (event.key === 'ArrowDown')
      setCommandHighlight((commandActive + 1) % commandRows.length);
    else if (event.key === 'ArrowUp')
      setCommandHighlight((commandActive - 1 + commandRows.length) % commandRows.length);
    else if (event.key === 'Enter' || event.key === 'Tab') {
      if (picked !== undefined) pickCommand(picked.id);
    } else return false;

    return true;
  };

  const onPickerKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    const picked = shown[highlighted];
    const at = filled.indexOf(tab);

    if (event.key === 'Escape') setDismissedAt(value);
    else if (shown.length === 0) return false;
    else if (event.key === 'ArrowDown') setHighlight((highlighted + 1) % shown.length);
    else if (event.key === 'ArrowUp')
      setHighlight((highlighted - 1 + shown.length) % shown.length);
    else if (event.key === 'ArrowRight' && filled.length > 1)
      showTab(filled[(at + 1) % filled.length] ?? tab);
    else if (event.key === 'ArrowLeft' && filled.length > 1)
      showTab(filled[(at - 1 + filled.length) % filled.length] ?? tab);
    else if ((event.key === 'Enter' || event.key === 'Tab') && picked) pick(picked.id);
    else return false;

    return true;
  };

  return {
    parts: splitMentions({ text: value, ids: props.referenceIds }).map((part, index) => ({
      ...part,
      key: `${String(index)}-${part.text}`,
    })),
    canPress: isAnswering || canSend,
    isLocked,
    button: isAnswering
      ? {
          label: t('CHAT.STOP_ANSWER'),
          icon: 'stop' as const,
          className: 'composer__send composer__send--stop',
        }
      : { label: t('CHAT.SEND'), icon: 'up' as const, className: 'composer__send' },
    iconMotion: {
      initial: { opacity: 0, scale: 0.6 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.6 },
      transition: { duration: MOTION.durationFast, ease: MOTION.ease },
    },
    onButtonClick: () => {
      if (isAnswering) onStop();
      else onSendClick();
    },
    placeholder: isDropping
      ? props.dropLabel
      : (lockedText ?? command?.placeholder ?? props.hint ?? t('CHAT.PLACEHOLDER')),
    fieldClassName: isLocked
      ? 'composer__field composer__field--locked'
      : isDropping
        ? 'composer__field composer__field--dropping'
        : 'composer__field',
    canAttach,
    attachmentMotion: {
      initial: { opacity: 0, scale: 0.92 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.92 },
      transition: { duration: MOTION.durationFast, ease: MOTION.ease },
    },
    onRemoveAttachment: props.onRemoveAttachment,
    onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const files = [...event.clipboardData.files];

      if (files.length === 0 || !canAttach) return;

      event.preventDefault();
      props.onFiles(files);
    },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!canAttach || !event.dataTransfer.types.includes('Files')) return;

      event.preventDefault();
      setDropping(true);
    },
    onDragLeave: () => {
      setDropping(false);
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDropping(false);

      if (canAttach) props.onFiles([...event.dataTransfer.files]);
    },
    isPickerOpen,
    isCommandOpen,
    commandHighlight: commandActive,
    commandChip:
      command === null
        ? null
        : {
            name: command.name,
            parts: command.parts.map((part) => ({
              key: part.key,
              text: part.text,
              className: part.isStrong
                ? 'composer__command-part composer__command-part--strong'
                : 'composer__command-part',
            })),
          },
    commandMotion: {
      initial: { opacity: 0, scale: 0.92 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.92 },
      transition: { duration: MOTION.durationFast, ease: MOTION.ease },
    },
    onPickCommand: pickCommand,
    onCommandHighlight: setCommandHighlight,
    highlighted,
    shown,
    tabs: MENTION_TABS.map((kind) => ({
      kind,
      count: mentions.filter((mention) => mention.kind === kind).length,
      isActive: kind === tab,
    })),
    onSendClick,
    onPick: pick,
    onHighlight: setHighlight,
    onTab: showTab,
    onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setHighlight(0);
      setCommandHighlight(0);
      onChange(event.target.value);
    },
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (isCommandOpen && onCommandKey(event)) {
        event.preventDefault();

        return;
      }

      if (event.key === 'Backspace' && value === '' && command !== null) {
        event.preventDefault();
        onCommandBack();

        return;
      }

      if (isPickerOpen && onPickerKey(event)) {
        event.preventDefault();

        return;
      }

      if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing)
        return;

      event.preventDefault();
      onSendClick();
    },
  };
};
