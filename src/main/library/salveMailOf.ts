import { SALVE_CONTACT } from '@/main/constants/SALVE_CONTACT';

/** O e-mail para a Salve Software, com o assunto e o texto da página, cortados. */
export function salveMailOf(letter: { subject: unknown; body: unknown }): string {
  const subject = textOf(letter.subject).slice(0, SALVE_CONTACT.subjectMax);
  const body = textOf(letter.body).slice(0, SALVE_CONTACT.bodyMax);

  return `mailto:${SALVE_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
