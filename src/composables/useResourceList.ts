import { reactive, ref, watch, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { toast } from 'vue-sonner'
import type { ListParams, Paginated, PaginationMeta } from '@/types'
import { errorMessage } from '@/services/api'

/**
 * Paginated + filterable list state for admin tables.
 * `filters` is reactive; changing it resets to page 1 and refetches (search is debounced).
 */
export function useResourceList<T, F extends Record<string, string | number | undefined>>(
  fetcher: (params: ListParams) => Promise<Paginated<T>>,
  initialFilters: F,
  options: { perPage?: number; immediate?: boolean } = {},
) {
  const items = ref([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const meta = ref<PaginationMeta>({
    page: 1,
    perPage: options.perPage ?? 10,
    total: 0,
    totalPages: 1,
  })
  const filters = reactive({ ...initialFilters }) as F

  let requestId = 0
  async function load() {
    const id = ++requestId
    loading.value = true
    error.value = null
    try {
      const res = await fetcher({ page: page.value, perPage: meta.value.perPage, ...filters })
      if (id !== requestId) return
      items.value = res.data
      meta.value = res.meta
    } catch (e) {
      if (id !== requestId) return
      error.value = errorMessage(e)
      toast.error(error.value)
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  const { search: _search, ...rest } = filters as Record<string, unknown>
  void _search
  watch(page, load)
  watch(
    () =>
      JSON.stringify(
        Object.fromEntries(
          Object.keys(rest).map((k) => [k, (filters as Record<string, unknown>)[k]]),
        ),
      ),
    () => {
      if (page.value !== 1) page.value = 1
      else load()
    },
  )
  if ('search' in filters) {
    watchDebounced(
      () => (filters as Record<string, unknown>).search,
      () => {
        if (page.value !== 1) page.value = 1
        else load()
      },
      { debounce: 300 },
    )
  }

  if (options.immediate !== false) load()

  return { items, loading, error, page, meta, filters, reload: load }
}
