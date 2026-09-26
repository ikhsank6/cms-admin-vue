import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Adds `[data-reveal]` to `root` and every `[data-reveal-item]` inside it, then toggles
 * `.is-visible` via IntersectionObserver as each element enters the viewport. A light,
 * CSS-driven alternative to a full animation library; fully inert under `prefers-reduced-motion`
 * (see the `[data-reveal]` rule in main.css).
 */
export function useRevealOnScroll(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = root.value
    if (!el) return
    const targets = [el, ...el.querySelectorAll<HTMLElement>('[data-reveal-item]')]
    targets.forEach((t) => t.setAttribute('data-reveal', ''))

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    targets.forEach((t) => observer?.observe(t))
  })

  onUnmounted(() => observer?.disconnect())
}
