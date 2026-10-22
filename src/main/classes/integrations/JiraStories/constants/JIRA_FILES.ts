export const JIRA_FILES = {
  readable:
    /^(image\/(png|jpe?g|gif|webp)|application\/(pdf|json)|text\/(plain|markdown|csv))$/i,
  maxFiles: 10,
  maxFileBytes: 10 * 1024 * 1024,
  maxTotalBytes: 30 * 1024 * 1024,
} as const;
