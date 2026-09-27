export type PaginationItem = number | 'ellipsis'

/**
 * Page numbers to render for a pager: always the first and last page, plus a window of
 * `siblingCount` pages on either side of `current`. Gaps become a single `'ellipsis'` entry.
 * Correct (and ellipsis-free) for any `total`, including 0/1/2 — no MUI-style edge-case math.
 */
export function paginationRange(
  current: number,
  total: number,
  siblingCount = 2,
): PaginationItem[] {
  if (total <= 0) return []
  const page = Math.min(Math.max(current, 1), total)

  const pages = new Set<number>([1, total])
  for (let i = page - siblingCount; i <= page + siblingCount; i++) {
    if (i >= 1 && i <= total) pages.add(i)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const items: PaginationItem[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) items.push('ellipsis')
    items.push(p)
  })
  return items
}
