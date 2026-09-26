import { defineStore } from 'pinia'
import { useDark, useLocalStorage, useToggle } from '@vueuse/core'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = useLocalStorage('cms.sidebarCollapsed', false)
  const mobileSidebarOpen = useLocalStorage('cms.mobileSidebar', false, {
    listenToStorageChanges: false,
  })
  const isDark = useDark({ storageKey: 'cms.theme' })
  const toggleDark = useToggle(isDark)
  return { sidebarCollapsed, mobileSidebarOpen, isDark, toggleDark }
})
