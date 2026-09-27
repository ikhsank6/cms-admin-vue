import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DataPagination from './DataPagination.vue'
import type { PaginationMeta } from '@/types'

const bigMeta: PaginationMeta = { page: 10, perPage: 10, total: 200, totalPages: 20 }

describe('DataPagination', () => {
  it('renders numbered page buttons with an ellipsis on both sides for a middle page', () => {
    const wrapper = mount(DataPagination, { props: { meta: bigMeta, modelValue: 10 } })
    const labels = wrapper.findAll('button').map((b) => b.text())
    expect(labels).toEqual(expect.arrayContaining(['1', '8', '9', '10', '11', '12', '20']))
    expect(wrapper.text()).toContain('…')
  })

  it('emits update:modelValue when a page number is clicked', async () => {
    const wrapper = mount(DataPagination, { props: { meta: bigMeta, modelValue: 10 } })
    await wrapper.find('button[aria-label="Halaman 12"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([12])
  })

  it('marks the current page with aria-current', () => {
    const wrapper = mount(DataPagination, { props: { meta: bigMeta, modelValue: 10 } })
    expect(wrapper.find('button[aria-label="Halaman 10"]').attributes('aria-current')).toBe('page')
    expect(
      wrapper.find('button[aria-label="Halaman 11"]').attributes('aria-current'),
    ).toBeUndefined()
  })

  it('disables prev/next at the boundaries', () => {
    const first = mount(DataPagination, {
      props: { meta: { ...bigMeta, page: 1 }, modelValue: 1 },
    })
    expect(first.find('button[aria-label="Sebelumnya"]').attributes('disabled')).toBeDefined()

    const last = mount(DataPagination, {
      props: { meta: { ...bigMeta, page: 20 }, modelValue: 20 },
    })
    expect(last.find('button[aria-label="Berikutnya"]').attributes('disabled')).toBeDefined()
  })

  it('jumps to a valid typed page and ignores an out-of-range one', async () => {
    const wrapper = mount(DataPagination, { props: { meta: bigMeta, modelValue: 10 } })
    const input = wrapper.find('input[type="number"]')

    await input.setValue('15')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([15])

    await input.setValue('999')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('update:modelValue')?.length).toBe(1) // no new emit
  })

  it('shows a page-size dropdown only when pageSizeOptions is given, and emits on change', async () => {
    const hidden = mount(DataPagination, { props: { meta: bigMeta, modelValue: 10 } })
    expect(hidden.find('select').exists()).toBe(false)

    const wrapper = mount(DataPagination, {
      props: { meta: bigMeta, modelValue: 10, pageSizeOptions: [10, 20, 50], pageSize: 10 },
    })
    await wrapper.find('select').setValue('50')
    expect(wrapper.emitted('update:pageSize')?.at(-1)).toEqual([50])
  })

  it('hides the jump-to-page form when hideJump is set', () => {
    const wrapper = mount(DataPagination, {
      props: { meta: bigMeta, modelValue: 10, hideJump: true },
    })
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('keeps the jump-to-page form in the footer even with a single page, disabled', () => {
    const oneMeta: PaginationMeta = { page: 1, perPage: 10, total: 5, totalPages: 1 }
    const wrapper = mount(DataPagination, { props: { meta: oneMeta, modelValue: 1 } })
    const form = wrapper.find('form')
    expect(form.exists()).toBe(true)
    expect(form.find('input').attributes('disabled')).toBeDefined()
    expect(form.find('button').attributes('disabled')).toBeDefined()
  })
})
