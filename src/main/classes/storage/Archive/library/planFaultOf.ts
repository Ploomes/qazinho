import { parseDocument } from 'yaml';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCase(value: unknown): boolean {
  return isRecord(value) && (value.steps === undefined || Array.isArray(value.steps));
}

/** Why a plan.yaml does not read as a plan, with the line the YAML broke at; null when it reads, empty included. */
export function planFaultOf(yaml: string): { line: number | null } | null {
  const document = parseDocument(yaml);
  const error = document.errors[0];

  if (error !== undefined) return { line: error.linePos?.[0].line ?? null };

  const read: unknown = document.toJS();

  if (read === null || read === undefined) return null;
  if (!isRecord(read)) return { line: null };
  if (read.cases === undefined || read.cases === null) return null;
  if (!Array.isArray(read.cases) || !read.cases.every(isCase)) return { line: null };

  return null;
}
