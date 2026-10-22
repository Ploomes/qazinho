import type { IJiraAttachment, IJiraFile } from '@/shared/types';
import { JIRA_FILES } from '@/main/classes/integrations/JiraStories/constants';

/** Which of a story's files QAzinho downloads for the agent: the kinds it can read, each and all of them under a size, up to a count; the rest say why not. */
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
