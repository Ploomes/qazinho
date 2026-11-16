import { describe, expect, it } from 'vitest';
import { salveMailOf } from '@/main/library/salveMailOf';

describe('salveMailOf', () => {
  it('writes to the Salve Software address with the subject and the text', () => {
    expect(
      salveMailOf({ subject: 'Um problema', body: 'O que aconteceu:\n\nQAzinho 0.18.0' }),
    ).toBe(
      'mailto:contact@salvesoftware.com?subject=Um%20problema&body=O%20que%20aconteceu%3A%0A%0AQAzinho%200.18.0',
    );
  });

  /** O endereço é fixo: nada que a página manda escolhe outro destinatário ou um cc. */
  it('keeps a crafted subject from adding a recipient', () => {
    const mail = salveMailOf({ subject: 'x&cc=other@example.com', body: '' });

    expect(mail.startsWith('mailto:contact@salvesoftware.com?subject=')).toBe(true);
    expect(mail).not.toContain('&cc=');
  });

  it('cuts a long text, and reads anything but a string as nothing', () => {
    const mail = salveMailOf({ subject: 42, body: 'a'.repeat(5000) });

    expect(mail).toContain('subject=&body=');
    expect(mail.length).toBeLessThan(2100);
  });
});
