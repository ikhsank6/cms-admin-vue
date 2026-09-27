import { describe, expect, it } from 'vitest'
import { paginationRange } from './pagination'

describe('paginationRange', () => {
  it('returns nothing for zero or negative totals', () => {
    expect(paginationRange(1, 0)).toEqual([])
    expect(paginationRange(1, -3)).toEqual([])
  })

  it('shows every page with no ellipsis when they all fit', () => {
    expect(paginationRange(1, 1)).toEqual([1])
    expect(paginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('collapses the middle when near the start', () => {
    expect(paginationRange(1, 20)).toEqual([1, 2, 3, 'ellipsis', 20])
  })

  it('collapses the middle when near the end', () => {
    expect(paginationRange(20, 20)).toEqual([1, 'ellipsis', 18, 19, 20])
  })

  it('shows both ellipses when current is in the middle of a long list', () => {
    expect(paginationRange(10, 20)).toEqual([1, 'ellipsis', 8, 9, 10, 11, 12, 'ellipsis', 20])
  })

  it('never repeats a page number', () => {
    for (let total = 1; total <= 15; total++) {
      for (let current = 1; current <= total; current++) {
        const numbers = paginationRange(current, total).filter((i): i is number => i !== 'ellipsis')
        expect(new Set(numbers).size).toBe(numbers.length)
      }
    }
  })

  it('clamps an out-of-range current page instead of producing invalid entries', () => {
    // 999 clamps to page 5 (the last page); its sibling window doesn't reach page 2.
    expect(paginationRange(999, 5)).toEqual([1, 'ellipsis', 3, 4, 5])
    // 0 clamps to page 1; its sibling window doesn't reach page 4.
    expect(paginationRange(0, 5)).toEqual([1, 2, 3, 'ellipsis', 5])
  })
})
