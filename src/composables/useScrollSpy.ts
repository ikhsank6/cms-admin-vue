import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/** Tracks which of `ids` is currently most visible in the viewport, for an in-page index nav. */
export function useScrollSpy(ids: Ref<string[]>) {
  const activeId = ref<string | null>(null)
  let observer: IntersectionObserver | null = null

  function observe() {
    observer?.disconnect()
    const ratios = new Map<string, number>()
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target.id, entry.intersectionRatio)
        let best: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = id
            bestRatio = ratio
          }
        }
        if (best) activeId.value = best
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    for (const id of ids.value) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  }

  onMounted(observe)
  onUnmounted(() => observer?.disconnect())

  return { activeId, refresh: observe }
}
