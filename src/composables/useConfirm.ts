import { reactive } from 'vue'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

const state = reactive({
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Konfirmasi',
  destructive: false,
  resolve: null as ((v: boolean) => void) | null,
})

/** Promise-based confirmation dialog, rendered once by <ConfirmDialog /> in App.vue. */
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    state.resolve?.(false)
    Object.assign(state, {
      open: true,
      title: options.title,
      description: options.description ?? '',
      confirmLabel: options.confirmLabel ?? 'Konfirmasi',
      destructive: options.destructive ?? false,
    })
    return new Promise((resolve) => (state.resolve = resolve))
  }
  function settle(value: boolean) {
    state.resolve?.(value)
    state.resolve = null
    state.open = false
  }
  return { state, confirm, settle }
}
