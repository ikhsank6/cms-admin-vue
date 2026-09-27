import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable, { type DataTableColumn } from './DataTable.vue'

interface Row {
  id: number
  name: string
  status: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', hideBelow: 'md' },
]
const rows: Row[] = [
  { id: 1, name: 'Alpha', status: 'Active' },
  { id: 2, name: 'Beta', status: 'Draft' },
]

describe('DataTable', () => {
  it('renders headers and default cell content from the row', () => {
    const wrapper = mount(DataTable, { props: { columns, rows } })
    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Name', 'Status'])
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Draft')
  })

  it('applies the responsive hide class only to columns that declare it', () => {
    const wrapper = mount(DataTable, { props: { columns, rows } })
    const headers = wrapper.findAll('th')
    expect(headers[0]!.classes()).not.toContain('hidden')
    expect(headers[1]!.classes()).toEqual(expect.arrayContaining(['hidden', 'md:table-cell']))
  })

  it('lets a named slot override a cell', () => {
    const wrapper = mount(DataTable, {
      props: { columns, rows },
      slots: {
        'cell-status': `<template #cell-status="{ row }">Custom:{{ row.status }}</template>`,
      },
    })
    expect(wrapper.text()).toContain('Custom:Active')
    expect(wrapper.text()).toContain('Custom:Draft')
  })

  it('shows skeleton rows while loading with no data yet, not once rows arrive', () => {
    const empty = mount(DataTable, { props: { columns, rows: [], loading: true, skeletonRows: 3 } })
    expect(empty.findAll('tbody tr')).toHaveLength(3)

    const loaded = mount(DataTable, { props: { columns, rows, loading: true } })
    expect(loaded.findAll('tbody tr')).toHaveLength(rows.length)
  })

  it('uses rowKey when provided, falling back to the row index', () => {
    const wrapper = mount(DataTable, {
      props: { columns, rows, rowKey: (r: object) => `row-${(r as Row).id}` },
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })
})
