import { defineStore } from 'pinia'
import { useDark, useLocalStorage, useToggle } from '@vueuse/core'

export const useUiStore = defineStore('ui', () => {
  /** Column 2 (submenu panel) visibility. The icon rail (column 1) is always shown. */
  const panelExpanded = useLocalStorage('cms.sidebarPanelExpanded', true)
  /** Which rail icon's submenu the panel is showing. */
  const selectedSection = useLocalStorage('cms.sidebarSection', 0)
  const mobileSidebarOpen = useLocalStorage('cms.mobileSidebar', false, {
    listenToStorageChanges: false,
  })
  const isDark = useDark({ storageKey: 'cms.theme' })
  const toggleDark = useToggle(isDark)

  /** Select a rail section and make sure its submenu panel is visible. */
  function selectSection(index: number) {
    selectedSection.value = index
    panelExpanded.value = true
  }

  return {
    panelExpanded,
    selectedSection,
    mobileSidebarOpen,
    isDark,
    toggleDark,
    selectSection,
  }
})
