import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Hide an element unless the current user has the permission(s).
 * Usage: v-can="'page.create'" or v-can="['page.update', 'page.publish']"
 */
export const vCan: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    apply(el, binding.value)
  },
  updated(el, binding) {
    apply(el, binding.value)
  },
}

function apply(el: HTMLElement, value: string | string[]) {
  const auth = useAuthStore()
  el.style.display = auth.can(value) ? '' : 'none'
}
