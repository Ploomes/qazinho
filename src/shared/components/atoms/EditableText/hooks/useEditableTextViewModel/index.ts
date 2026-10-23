import type { IEditableTextProps } from '@/shared/components/atoms/EditableText/types';

export const useEditableTextViewModel = (props: IEditableTextProps) => {
  const { value, isLocked = false, isTitle = false, onCommit } = props;

  return {
    value,
    isLocked,
    isAutoFocused: props.isAutoFocused === true && !isLocked,
    className: isTitle ? 'editable-text editable-text--title' : 'editable-text',
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isLocked) onCommit(event.target.value);
    },
  };
};
