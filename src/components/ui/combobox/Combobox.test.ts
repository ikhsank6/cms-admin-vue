import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Combobox } from '.'

const options = [
  { label: 'Alpha', value: 1 },
  { label: 'Beta', value: 2 },
]

describe('Combobox', () => {
  it('shows the placeholder when nothing is selected', () => {
    const wrapper = mount(Combobox, { props: { options, placeholder: 'Pick one' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Pick one')
  })

  it("displays the selected option's label, not its raw value", () => {
    const wrapper = mount(Combobox, { props: { options, modelValue: 2 } })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Beta')
  })

  it('shows a clear button only when something is selected and clearable', () => {
    const none = mount(Combobox, { props: { options, modelValue: null } })
    expect(none.find('button[aria-label="Hapus pilihan"]').exists()).toBe(false)

    const selected = mount(Combobox, { props: { options, modelValue: 1 } })
    expect(selected.find('button[aria-label="Hapus pilihan"]').exists()).toBe(true)

    const unclearable = mount(Combobox, { props: { options, modelValue: 1, clearable: false } })
    expect(unclearable.find('button[aria-label="Hapus pilihan"]').exists()).toBe(false)
  })

  it('clears the selection when the clear button is clicked', async () => {
    const wrapper = mount(Combobox, { props: { options, modelValue: 1 } })
    await wrapper.find('button[aria-label="Hapus pilihan"]').trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('falls back to an empty display when the model value matches no option', () => {
    const wrapper = mount(Combobox, { props: { options, modelValue: 999 } })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })
})
