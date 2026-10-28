import type { IJiraAttachment, IJiraFile } from '@/shared/types';
import { JIRA_FILES } from '@/main/classes/integrations/JiraStories/constants';

/**
 * Quais arquivos de uma história o QAzinho baixa para o agente: os tipos que ele consegue
 * ler, cada um e todos sob um tamanho, até uma contagem; o resto diz por quê não.
 */
export function filesToReadOf(attachments: IJiraAttachment[]): IJiraFile[] {
  let kept = 0;
  let bytes = 0;

  return attachments.map((attachment): IJiraFile => {
    const file = {
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      path: null,
    };

    if (!JIRA_FILES.readable.test(attachment.mimeType))
      return { ...file, note: 'not-readable' };

    if (
      attachment.size > JIRA_FILES.maxFileBytes ||
      bytes + attachment.size > JIRA_FILES.maxTotalBytes
    )
      return { ...file, note: 'too-large' };

    if (kept >= JIRA_FILES.maxFiles) return { ...file, note: 'too-many' };

    kept += 1;
    bytes += attachment.size;

    return { ...file, note: 'read' };
  });
}
