const TYPED = ['text', 'email', 'url', 'search', 'password', 'number', 'tel', ''];

/**
 * Se uma tecla confirma o modal: Enter, sozinho, num campo em que o QA digita, que nada
 * dentro dele já tratou, como uma lista escolhendo o que o Enter escolheu.
 */
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
