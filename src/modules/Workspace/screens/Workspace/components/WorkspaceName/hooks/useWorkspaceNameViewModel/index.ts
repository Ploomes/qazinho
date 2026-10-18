import type { IWorkspaceNameProps } from '@/modules/Workspace/screens/Workspace/components/WorkspaceName/types';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

export const useWorkspaceNameViewModel = (props: IWorkspaceNameProps) => {
  const { name, onRename } = props;
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = draft !== null;

  useEffect(() => {
    if (!isEditing) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const commit = () => {
    const next = draft?.trim() ?? '';

    setDraft(null);
    if (next.length > 0 && next !== name) onRename(next);
  };

  return {
    isEditing,
    draft: draft ?? name,
    inputRef,
    onStart: () => {
      setDraft(name);
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
    },
    onCommit: commit,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setDraft(null);
      }
    },
  };
};
