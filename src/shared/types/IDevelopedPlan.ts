/** Os casos de um plano que têm gravação, e os arquivos que essas gravações sobem. */
export interface IDevelopedPlan {
  caseIds: string[];
  files: { name: string; size: number }[];
}
