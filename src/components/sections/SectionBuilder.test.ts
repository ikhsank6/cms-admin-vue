import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick, ref } from 'vue'
import SectionBuilder from './SectionBuilder.vue'
import { createSection } from './registry'
import type { PageSection } from '@/types'

function mountBuilder(initial: PageSection[]) {
  const sections = ref(initial)
  const wrapper = mount(SectionBuilder, {
    props: {
      modelValue: sections.value,
      'onUpdate:modelValue': (v: PageSection[]) => (sections.value = v),
    },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
  return { wrapper, sections }
}

describe('SectionBuilder', () => {
  it('reorders, toggles and removes sections', async () => {
    const hero = createSection('HERO', 1)
    const cta = createSection('CTA', 2)
    const { wrapper, sections } = mountBuilder([hero, cta])
    expect(wrapper.findAll('[data-testid="section-item"]')).toHaveLength(2)

    await wrapper.findAll('button[title="Turun"]')[0]!.trigger('click')
    expect(sections.value.map((s) => s.type)).toEqual(['CTA', 'HERO'])
    expect(sections.value.map((s) => s.sortOrder)).toEqual([1, 2])

    await wrapper.findAll('button[title="Nonaktifkan"]')[0]!.trigger('click')
    expect(sections.value[0]!.isActive).toBe(false)

    await wrapper.findAll('button[title="Duplikat"]')[1]!.trigger('click')
    await nextTick()
    expect(sections.value.map((s) => s.type)).toEqual(['CTA', 'HERO', 'HERO'])
    expect(sections.value[2]!.content).toEqual(sections.value[1]!.content)
    expect(sections.value[2]!.content).not.toBe(sections.value[1]!.content)

    await wrapper.findAll('button[title="Hapus"]')[0]!.trigger('click')
    expect(sections.value.map((s) => s.type)).toEqual(['HERO', 'HERO'])
    wrapper.unmount()
  })
})
