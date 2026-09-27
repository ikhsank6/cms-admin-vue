<script setup lang="ts" generic="T extends object">
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn {
  /** Matches a `#cell-<key>`/`#head-<key>` slot and, by default, the row's own field name. */
  key: string
  label?: string
  class?: string
  /** Hides the column below this breakpoint, e.g. `hidden md:table-cell`. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[]
    rows: T[]
    /** Row `:key` and, combined with `testId`, the row's `data-testid` suffix. Defaults to index. */
    rowKey?: (row: T, index: number) => string | number
    loading?: boolean
    skeletonRows?: number
    /** `data-testid` applied to every `<tr>` (e.g. "page-row"), for E2E selectors. */
    testId?: string
  }>(),
  { skeletonRows: 5 },
)

const hideClass = (bp?: DataTableColumn['hideBelow']) => bp && `hidden ${bp}:table-cell`
const key = (row: T, i: number) => props.rowKey?.(row, i) ?? i
// A TS generic cast (`as Record<...>`) inline in the template confuses the SFC parser's
// tag scanner, so the fallback cell value is read through this helper instead.
const cellValue = (row: T, colKey: string) => (row as Record<string, unknown>)[colKey]
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead
          v-for="col in columns"
          :key="col.key"
          :class="cn(hideClass(col.hideBelow), col.class)"
        >
          <slot :name="`head-${col.key}`">{{ col.label }}</slot>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <template v-if="loading && !rows.length">
        <TableRow v-for="i in skeletonRows" :key="`skeleton-${i}`">
          <TableCell :colspan="columns.length"><Skeleton class="h-6" /></TableCell>
        </TableRow>
      </template>
      <TableRow v-for="(row, i) in rows" :key="key(row, i)" :data-testid="testId">
        <TableCell
          v-for="col in columns"
          :key="col.key"
          :class="cn(hideClass(col.hideBelow), col.class)"
        >
          <slot :name="`cell-${col.key}`" :row="row" :index="i">{{ cellValue(row, col.key) }}</slot>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
