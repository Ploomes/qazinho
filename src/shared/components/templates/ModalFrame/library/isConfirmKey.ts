const TYPED = ['text', 'email', 'url', 'search', 'password', 'number', 'tel', ''];

/** Whether a key press confirms the modal: Enter, alone, in a field the QA types in, that nothing inside it handled already, such as a list picking what Enter chose. */
export function isConfirmKey(props: {
  key: string;
  isHandled: boolean;
  hasModifier: boolean;
  tag: string;
  type: string;
  role: string | null;
}): boolean {
  return (
    props.key === 'Enter' &&
    !props.isHandled &&
    !props.hasModifier &&
    props.tag === 'INPUT' &&
    TYPED.includes(props.type) &&
    props.role !== 'combobox'
  );
}
