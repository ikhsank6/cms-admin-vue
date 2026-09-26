export interface DiffEntry {
  path: string
  before: string
  after: string
}

function flatten(
  value: unknown,
  prefix = '',
  out: Record<string, string> = {},
): Record<string, string> {
  if (value === null || value === undefined) {
    if (prefix) out[prefix] = ''
    return out
  }
  if (typeof value !== 'object') {
    out[prefix] = String(value)
    return out
  }
  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value)
  if (!entries.length && prefix) out[prefix] = Array.isArray(value) ? '[]' : '{}'
  for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  return out
}

/** Flat field-level diff between two JSON values (for audit log display). */
export function diffObjects(before: unknown, after: unknown): DiffEntry[] {
  const a = flatten(before)
  const b = flatten(after)
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  return keys
    .filter((k) => a[k] !== b[k] || before == null || after == null)
    .map((k) => ({ path: k, before: a[k] ?? '', after: b[k] ?? '' }))
}
