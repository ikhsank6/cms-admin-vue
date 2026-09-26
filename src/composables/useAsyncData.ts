import { ref, shallowRef, watch, type WatchSource } from 'vue'
import { ApiError, toApiError } from '@/services/api'

/** Fetch data, re-running when `source` changes. Exposes loading / notFound / error states. */
export function useAsyncData<T>(source: WatchSource, fetcher: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const loading = ref(true)
  const error = ref<ApiError | null>(null)
  const notFound = ref(false)

  async function run() {
    loading.value = true
    error.value = null
    notFound.value = false
    try {
      data.value = await fetcher()
    } catch (e) {
      const err = toApiError(e)
      error.value = err
      notFound.value = err.status === 404
      data.value = null
    } finally {
      loading.value = false
    }
  }

  watch(source, run, { immediate: true })
  return { data, loading, error, notFound, refresh: run }
}
