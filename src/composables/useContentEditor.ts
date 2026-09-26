import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useConfirm } from './useConfirm'

/** Shared editor state: create vs edit mode + unsaved-changes guard. */
export function useContentEditor<T>(snapshot: () => T) {
  const route = useRoute()
  const id = computed(() => (route.params.id ? Number(route.params.id) : null))
  const isNew = computed(() => id.value === null)
  const baseline = ref('')
  const dirty = ref(false)
  const { confirm } = useConfirm()

  // Client-only render keys (e.g. section `key`) are not content changes.
  const serialize = () => JSON.stringify(snapshot(), (k, v) => (k === 'key' ? undefined : v))

  function markClean() {
    baseline.value = serialize()
    dirty.value = false
  }

  watch(serialize, (v) => (dirty.value = !!baseline.value && v !== baseline.value))

  const beforeUnload = (e: BeforeUnloadEvent) => {
    if (dirty.value) e.preventDefault()
  }
  window.addEventListener('beforeunload', beforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

  onBeforeRouteLeave(async () => {
    if (!dirty.value) return true
    return confirm({
      title: 'Tinggalkan halaman?',
      description: 'Perubahan yang belum disimpan akan hilang.',
      confirmLabel: 'Tinggalkan',
      destructive: true,
    })
  })

  return { id, isNew, dirty, markClean }
}
